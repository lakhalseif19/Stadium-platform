import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

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
      const accessSecret = this.configService.get<string>('jwt.accessSecret');
      let payload;
      try {
        payload = await this.jwtService.verifyAsync(token, { secret: accessSecret });
      } catch {
        const legacySecret = process.env.JWT_SECRET;
        if (!legacySecret || legacySecret === accessSecret) throw new Error('Invalid access token');
        payload = await this.jwtService.verifyAsync(token, { secret: legacySecret });
      }
      if (payload.tokenType !== 'access') {
        throw new UnauthorizedException('Access token required');
      }
      (request as any).user = { ...payload, id: payload.sub };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
