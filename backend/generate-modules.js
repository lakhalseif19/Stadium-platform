const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'src');

const files = {};

// HEALTH
files['health/health.module.ts'] = `import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}`;

files['health/health.controller.ts'] = `import { Controller, Get, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { DATABASE_POOL } from '../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Pool } from 'pg';
import Redis from 'ioredis';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async ready() {
    let dbStatus = 'down';
    let redisStatus = 'down';
    try {
      await this.pool.query('SELECT 1');
      dbStatus = 'up';
    } catch (e) {}
    try {
      if (await this.redis.ping() === 'PONG') {
        redisStatus = 'up';
      }
    } catch (e) {}
    const isReady = dbStatus === 'up' && redisStatus === 'up';
    const result = {
      status: isReady ? 'ready' : 'not_ready',
      dependencies: { database: dbStatus, redis: redisStatus }
    };
    if (!isReady) {
      throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return result;
  }
}`;

// AUTH DTOs
files['auth/dto/register.dto.ts'] = `import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty()
  @IsString()
  first_name!: string;

  @ApiProperty()
  @IsString()
  last_name!: string;
}`;

files['auth/dto/login.dto.ts'] = `import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsString()
  password!: string;
}`;

files['auth/dto/verify-otp.dto.ts'] = `import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty()
  @IsString()
  phone!: string;

  @ApiProperty()
  @IsString()
  code!: string;
}`;

files['auth/dto/refresh-token.dto.ts'] = `import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}`;

files['auth/dto/forgot-password.dto.ts'] = `import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}`;

files['auth/dto/reset-password.dto.ts'] = `import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  phone!: string;

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}`;

// AUTH GUARDS
files['auth/guards/jwt-auth.guard.ts'] = `import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException('Access token missing');

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}`;

files['auth/guards/jwt-refresh.guard.ts'] = `import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException('Refresh token missing');

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}`;

files['auth/auth.service.ts'] = `import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
    @Inject(DATABASE_POOL) private pool: Pool,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.phone && !dto.email) throw new BusinessException('Phone or email required');
    const hash = await argon2.hash(dto.password);
    const result = await this.pool.query(
      'INSERT INTO users (phone, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [dto.phone || null, dto.email || null, hash, dto.first_name, dto.last_name]
    );
    const userId = result.rows[0].id;
    if (dto.phone) {
      await this.generateAndSendOtp(dto.phone);
    }
    return { message: 'User registered successfully', userId };
  }

  async generateAndSendOtp(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await argon2.hash(otp);
    await this.redis.set(\`otp:\${phone}\`, hash, 'EX', 300);
    await this.redis.set(\`otp_attempts:\${phone}\`, 0, 'EX', 300);
    // Real application would send SMS here
  }

  async verifyOtp(phone: string, code: string) {
    const attemptsKey = \`otp_attempts:\${phone}\`;
    const attemptsStr = await this.redis.get(attemptsKey);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;
    if (attempts >= 5) throw new BusinessException('Too many attempts');

    const hash = await this.redis.get(\`otp:\${phone}\`);
    if (!hash) throw new BusinessException('OTP expired or invalid');

    const isValid = await argon2.verify(hash, code);
    if (!isValid) {
      await this.redis.incr(attemptsKey);
      throw new BusinessException('Invalid OTP');
    }
    await this.redis.del(\`otp:\${phone}\`, attemptsKey);
    await this.pool.query('UPDATE users SET phone_verified = true WHERE phone = $1', [phone]);
    return { message: 'Phone verified' };
  }

  async login(dto: LoginDto) {
    const query = dto.phone 
      ? 'SELECT id, password_hash, phone_verified, is_active FROM users WHERE phone = $1'
      : 'SELECT id, password_hash, phone_verified, is_active FROM users WHERE email = $1';
    const value = dto.phone || dto.email;
    const res = await this.pool.query(query, [value]);
    if (!res.rows.length) throw new UnauthorizedException('Invalid credentials');
    
    const user = res.rows[0];
    if (!user.is_active) throw new UnauthorizedException('Account disabled');
    if (!user.phone_verified && dto.phone) throw new UnauthorizedException('Phone not verified');

    const isValid = await argon2.verify(user.password_hash, dto.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id);
  }

  async generateTokens(userId: string) {
    const rolesRes = await this.pool.query(
      'SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1', [userId]
    );
    const roles = rolesRes.rows.map(r => r.name);
    
    const permRes = await this.pool.query(
      \`SELECT p.name FROM permissions p 
       JOIN role_permissions rp ON p.id = rp.permission_id 
       JOIN user_roles ur ON rp.role_id = ur.role_id 
       WHERE ur.user_id = $1\`, [userId]
    );
    const permissions = permRes.rows.map(p => p.name);

    const payload = { sub: userId, roles, permissions };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '15m' });
    const refreshToken = await this.jwtService.signAsync({ sub: userId }, { expiresIn: '7d' });

    const hash = await argon2.hash(refreshToken);
    await this.redis.set(\`rt:\${userId}\`, hash, 'EX', 7 * 24 * 60 * 60);

    return { accessToken, refreshToken };
  }

  async refresh(userId: string, refreshToken: string) {
    const hash = await this.redis.get(\`rt:\${userId}\`);
    if (!hash) throw new UnauthorizedException('Refresh token invalid');
    const isValid = await argon2.verify(hash, refreshToken);
    if (!isValid) throw new UnauthorizedException('Refresh token invalid');
    return this.generateTokens(userId);
  }
}`;

files['auth/auth.controller.ts'] = `import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }

  @Public()
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Refresh tokens' })
  refresh(@Request() req: any, @Body() dto: RefreshTokenDto) {
    return this.authService.refresh(req.user.sub, dto.refreshToken);
  }
}`;

files['auth/auth.module.ts'] = `import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'super-secret-key-123',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}`;

// USERS MODULE
files['users/dto/create-user.dto.ts'] = `import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty()
  @IsString()
  first_name!: string;

  @ApiProperty()
  @IsString()
  last_name!: string;
}`;

files['users/dto/update-user.dto.ts'] = `import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}`;

files['users/dto/user-response.dto.ts'] = `import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() phone?: string;
  @ApiProperty() email?: string;
  @ApiProperty() first_name!: string;
  @ApiProperty() last_name!: string;
  @ApiProperty() is_active!: boolean;
  @ApiProperty() phone_verified!: boolean;
}`;

files['users/users.repository.ts'] = `import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_POOL } from '../database/database.module';
import { Pool } from 'pg';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  async findAll(limit: number, offset: number) {
    const res = await this.pool.query(
      'SELECT id, phone, email, first_name, last_name, is_active, phone_verified FROM users LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countRes = await this.pool.query('SELECT COUNT(*) FROM users');
    return { data: res.rows, total: parseInt(countRes.rows[0].count) };
  }

  async findById(id: string) {
    const res = await this.pool.query(
      'SELECT id, phone, email, first_name, last_name, is_active, phone_verified FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0];
  }

  async create(data: CreateUserDto, passwordHash: string) {
    const res = await this.pool.query(
      'INSERT INTO users (phone, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, phone, email, first_name, last_name, is_active',
      [data.phone || null, data.email || null, passwordHash, data.first_name, data.last_name]
    );
    return res.rows[0];
  }

  async update(id: string, data: UpdateUserDto) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        fields.push(\`\${k} = $\${idx++}\`);
        values.push(v);
      }
    }
    if (!fields.length) return this.findById(id);
    values.push(id);
    const res = await this.pool.query(
      \`UPDATE users SET \${fields.join(', ')} WHERE id = $\${idx} RETURNING id, phone, email, first_name, last_name, is_active\`,
      values
    );
    return res.rows[0];
  }

  async toggleActive(id: string) {
    const res = await this.pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
      [id]
    );
    return res.rows[0];
  }
}`;

files['users/users.service.ts'] = `import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private repo: UsersRepository) {}

  async findAll(limit = 10, offset = 0) {
    return this.repo.findAll(limit, offset);
  }

  async findById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const hash = await argon2.hash(dto.password);
    return this.repo.create(dto, hash);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.repo.update(id, dto);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async toggleActive(id: string) {
    return this.repo.toggleActive(id);
  }
}`;

files['users/users.controller.ts'] = `import { Controller, Get, Post, Put, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.sub);
  }

  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'List users (Admin)' })
  findAll(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.usersService.findAll(limit ? Number(limit) : 10, offset ? Number(offset) : 0);
  }

  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin)' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Create user (Admin)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Roles('admin')
  @Put(':id')
  @ApiOperation({ summary: 'Update user (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Roles('admin')
  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle user active status (Admin)' })
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}`;

files['users/users.module.ts'] = `import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}`;

// RBAC
files['rbac/guards/roles.guard.ts'] = `import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roles) return false;
    return requiredRoles.some((role: string) => user.roles.includes(role));
  }
}`;

files['rbac/guards/permissions.guard.ts'] = `import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPerms = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPerms) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.permissions) return false;
    return requiredPerms.every((perm: string) => user.permissions.includes(perm));
  }
}`;

files['rbac/rbac.repository.ts'] = `import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_POOL } from '../database/database.module';
import { Pool } from 'pg';

@Injectable()
export class RbacRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  async getUserRolesAndPermissions(userId: string) {
    const rolesRes = await this.pool.query(
      'SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1', [userId]
    );
    const permRes = await this.pool.query(
      \`SELECT p.name FROM permissions p 
       JOIN role_permissions rp ON p.id = rp.permission_id 
       JOIN user_roles ur ON rp.role_id = ur.role_id 
       WHERE ur.user_id = $1\`, [userId]
    );
    return {
      roles: rolesRes.rows.map(r => r.name),
      permissions: permRes.rows.map(p => p.name)
    };
  }

  async assignRole(userId: string, roleName: string) {
    const roleRes = await this.pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
    if (!roleRes.rows.length) return false;
    const roleId = roleRes.rows[0].id;
    await this.pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, roleId]
    );
    return true;
  }

  async removeRole(userId: string, roleName: string) {
    const roleRes = await this.pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
    if (!roleRes.rows.length) return false;
    const roleId = roleRes.rows[0].id;
    await this.pool.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
    return true;
  }
}`;

files['rbac/rbac.service.ts'] = `import { Injectable } from '@nestjs/common';
import { RbacRepository } from './rbac.repository';

@Injectable()
export class RbacService {
  constructor(private repo: RbacRepository) {}

  async getUserRolesAndPermissions(userId: string) {
    return this.repo.getUserRolesAndPermissions(userId);
  }

  async assignRole(userId: string, roleName: string) {
    return this.repo.assignRole(userId, roleName);
  }

  async removeRole(userId: string, roleName: string) {
    return this.repo.removeRole(userId, roleName);
  }
}`;

files['rbac/rbac.module.ts'] = `import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacRepository } from './rbac.repository';

@Module({
  providers: [RbacService, RbacRepository],
  exports: [RbacService],
})
export class RbacModule {}`;

// AUDIT
files['audit/audit.repository.ts'] = `import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_POOL } from '../database/database.module';
import { Pool } from 'pg';

@Injectable()
export class AuditRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  async log(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    oldValues: any,
    newValues: any,
    ipAddress: string | null
  ) {
    await this.pool.query(
      \`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)\`,
      [userId, action, entityType, entityId, oldValues, newValues, ipAddress]
    );
  }

  async findAll(limit: number, offset: number) {
    const res = await this.pool.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countRes = await this.pool.query('SELECT COUNT(*) FROM audit_logs');
    return { data: res.rows, total: parseInt(countRes.rows[0].count) };
  }
}`;

files['audit/audit.service.ts'] = `import { Injectable } from '@nestjs/common';
import { AuditRepository } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private repo: AuditRepository) {}

  private maskSensitive(data: any): any {
    if (!data) return data;
    const sensitiveKeys = ['password', 'password_hash', 'otp', 'token', 'secret', 'refreshtoken', 'accesstoken'];
    const masked = { ...data };
    for (const key of Object.keys(masked)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        masked[key] = '***MASKED***';
      } else if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = this.maskSensitive(masked[key]);
      }
    }
    return masked;
  }

  async log(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    oldValues: any,
    newValues: any,
    ipAddress: string | null = null
  ) {
    const safeOld = this.maskSensitive(oldValues);
    const safeNew = this.maskSensitive(newValues);
    return this.repo.log(userId, action, entityType, entityId, safeOld, safeNew, ipAddress);
  }

  async findAll(limit = 10, offset = 0) {
    return this.repo.findAll(limit, offset);
  }
}`;

files['audit/audit.controller.ts'] = `import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../common/decorators';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs (Admin)' })
  findAll(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.auditService.findAll(limit ? Number(limit) : 10, offset ? Number(offset) : 0);
  }
}`;

files['audit/audit.module.ts'] = `import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditRepository } from './audit.repository';

@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditRepository],
  exports: [AuditService],
})
export class AuditModule {}`;

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(srcDir, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
}

console.log('Modules generated successfully.');
