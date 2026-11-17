import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException('Refresh token missing');

    try {
      const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
      let payload;
      try {
        payload = await this.jwtService.verifyAsync(token, { secret: refreshSecret });
      } catch {
        const legacySecret = process.env.JWT_SECRET;
        if (!legacySecret || legacySecret === refreshSecret)
          throw new Error('Invalid refresh token');
        payload = await this.jwtService.verifyAsync(token, { secret: legacySecret });
      }
      // Legacy refresh tokens are accepted during their remaining seven-day TTL;
      // AuthService still verifies each token against the user's Redis hash.
      if ((payload.tokenType && payload.tokenType !== 'refresh') || !payload.sub) {
        throw new UnauthorizedException('Refresh token required');
      }
      (request as any).user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
