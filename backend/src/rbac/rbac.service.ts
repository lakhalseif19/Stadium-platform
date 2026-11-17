import { Injectable } from '@nestjs/common';
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
}
