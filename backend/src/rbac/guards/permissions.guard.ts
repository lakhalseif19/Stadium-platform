import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
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
}
