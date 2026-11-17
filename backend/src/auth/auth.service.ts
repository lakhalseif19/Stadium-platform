import {
  Injectable,
  Inject,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DATABASE_POOL } from '../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Pool } from 'pg';
import Redis from 'ioredis';
import * as argon2 from 'argon2';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BusinessException } from '../common/exceptions';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // REGISTER
  async register(dto: RegisterDto) {
    const phone = dto.phone?.trim() || null;
    const email = dto.email?.trim().toLowerCase() || null;

    if (!phone && !email) {
      throw new BusinessException('Phone or email required');
    }

    // Do not create an account until the selected contact method can receive
    // a real verification challenge. No SMS or email provider is configured.
    throw new ServiceUnavailableException(
      'Registration is unavailable until a real phone or email verification provider is configured',
    );
  }

  // VERIFY PHONE OTP
  async verifyOtp(phone: string, code: string) {
    const normalizedPhone = phone.trim();
    const attemptsKey = `otp_attempts:${normalizedPhone}`;
    const otpKey = `otp:${normalizedPhone}`;
    let admitted: unknown;
    try {
      admitted = await this.redis.eval(
        `local attempts = redis.call('INCR', KEYS[1])
         if redis.call('TTL', KEYS[1]) < 0 then redis.call('EXPIRE', KEYS[1], 300) end
         if attempts > 5 then return 0 end
         return 1`,
        1,
        attemptsKey,
      );
    } catch {
      throw new ServiceUnavailableException('OTP verification service is unavailable');
    }

    if (Number(admitted) !== 1) {
      throw new BusinessException('Too many attempts');
    }

    let hash: string | null;
    try {
      hash = await this.redis.get(otpKey);
    } catch {
      throw new ServiceUnavailableException('OTP verification service is unavailable');
    }

    if (!hash) {
      throw new BusinessException('OTP expired or invalid');
    }

    const isValid = await argon2.verify(hash, code);

    if (!isValid) {
      throw new BusinessException('Invalid OTP');
    }

    const updated = await this.pool.query(
      `UPDATE users
       SET phone_verified_at = NOW()
       WHERE phone = $1`,
      [normalizedPhone],
    );

    if (updated.rowCount !== 1) {
      throw new BusinessException('OTP expired or invalid');
    }

    let consumed: unknown;
    try {
      consumed = await this.redis.eval(
        `if redis.call('GET', KEYS[1]) == ARGV[1] then
           redis.call('DEL', KEYS[1], KEYS[2])
           return 1
         end
         return 0`,
        2,
        otpKey,
        attemptsKey,
        hash,
      );
    } catch {
      throw new ServiceUnavailableException('OTP verification service is unavailable');
    }

    if (Number(consumed) !== 1) {
      throw new BusinessException('OTP expired or invalid');
    }

    return { message: 'Phone verified successfully' };
  }

  // LOGIN
  async login(dto: LoginDto) {
    const phone = dto.phone?.trim();
    const email = dto.email?.trim().toLowerCase();

    if (!phone && !email) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const query = phone
      ? `SELECT id, phone, email, password_hash,
                phone_verified_at, email_verified_at, is_active
         FROM users
         WHERE phone = $1`
      : `SELECT id, phone, email, password_hash,
                phone_verified_at, email_verified_at, is_active
         FROM users
         WHERE email = $1`;

    const result = await this.pool.query(query, [phone || email]);

    if (!result.rows.length) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = result.rows[0];

    const isValid = await argon2.verify(user.password_hash, dto.password);

    if (!isValid || !user.is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (phone ? !user.phone_verified_at : !user.email_verified_at) {
      throw new UnauthorizedException('Account verification required');
    }

    await this.pool.query(
      `UPDATE users
       SET last_login_at = NOW()
       WHERE id = $1`,
      [user.id],
    );

    return this.generateTokens(user.id);
  }

  // GENERATE ACCESS AND REFRESH TOKENS + USER
  async generateTokens(userId: string, expectedRefreshHash?: string) {
    const userResult = await this.pool.query(
      `SELECT id, phone, email, first_name, last_name
       FROM users
       WHERE id = $1`,
      [userId],
    );

    if (!userResult.rows.length) {
      throw new UnauthorizedException('User not found');
    }

    const dbUser = userResult.rows[0];

    const rolesResult = await this.pool.query(
      `SELECT r.name
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId],
    );

    const roles: string[] = rolesResult.rows.map((row: { name: string }) => row.name);

    const permissionsResult = await this.pool.query(
      `SELECT DISTINCT p.name
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = $1`,
      [userId],
    );

    const permissions: string[] = permissionsResult.rows.map((row: { name: string }) => row.name);

    const payload = {
      sub: userId,
      roles,
      permissions,
      tokenType: 'access',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, tokenType: 'refresh' },
      { secret: this.configService.get<string>('jwt.refreshSecret'), expiresIn: '7d' },
    );

    const refreshTokenHash = await argon2.hash(refreshToken);

    if (expectedRefreshHash) {
      const rotated = await this.redis.eval(
        `if redis.call('GET', KEYS[1]) == ARGV[1] then
           redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
           return 1
         end
         return 0`,
        1,
        `rt:${userId}`,
        expectedRefreshHash,
        refreshTokenHash,
        7 * 24 * 60 * 60,
      );

      if (Number(rotated) !== 1) {
        throw new UnauthorizedException('Refresh token already used');
      }
    } else {
      await this.redis.set(`rt:${userId}`, refreshTokenHash, 'EX', 7 * 24 * 60 * 60);
    }

    const role = roles.includes('SUPER_ADMIN')
      ? 'SUPER_ADMIN'
      : roles.includes('ADMIN')
        ? 'ADMIN'
        : roles.includes('GUARD')
          ? 'GUARD'
          : 'CITIZEN';

    return {
      accessToken,
      refreshToken,
      user: {
        id: dbUser.id,
        phone: dbUser.phone ?? '',
        role,
        name: [dbUser.first_name, dbUser.last_name].filter(Boolean).join(' '),
      },
    };
  }

  // REFRESH TOKENS
  async refresh(userId: string, refreshToken: string) {
    const hash = await this.redis.get(`rt:${userId}`);

    if (!hash) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    const isValid = await argon2.verify(hash, refreshToken);

    if (!isValid) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    return this.generateTokens(userId, hash);
  }

  async logout(userId: string) {
    await this.redis.del(`rt:${userId}`);
    return { message: 'Logged out successfully' };
  }
}
