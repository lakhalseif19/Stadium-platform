import { Injectable } from '@nestjs/common';
import { AuditRepository } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private repo: AuditRepository) {}

  private maskSensitive(data: any): any {
    if (!data) return data;
    const sensitiveKeys = [
      'password',
      'password_hash',
      'otp',
      'token',
      'secret',
      'refreshtoken',
      'accesstoken',
    ];
    const masked = { ...data };
    for (const key of Object.keys(masked)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
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
    ipAddress: string | null = null,
  ) {
    const safeOld = this.maskSensitive(oldValues);
    const safeNew = this.maskSensitive(newValues);
    return this.repo.log(userId, action, entityType, entityId, safeOld, safeNew, ipAddress);
  }

  async findAll(limit = 10, offset = 0) {
    return this.repo.findAll(limit, offset);
  }
}
