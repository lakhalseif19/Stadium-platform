import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_POOL } from '../database/database.module';
import { Pool } from 'pg';

@Injectable()
export class RbacRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  async getUserRolesAndPermissions(userId: string) {
    const rolesRes = await this.pool.query(
      'SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
      [userId],
    );
    const permRes = await this.pool.query(
      `SELECT p.name FROM permissions p 
       JOIN role_permissions rp ON p.id = rp.permission_id 
       JOIN user_roles ur ON rp.role_id = ur.role_id 
       WHERE ur.user_id = $1`,
      [userId],
    );
    return {
      roles: rolesRes.rows.map((r) => r.name),
      permissions: permRes.rows.map((p) => p.name),
    };
  }

  async assignRole(userId: string, roleName: string) {
    const roleRes = await this.pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
    if (!roleRes.rows.length) return false;
    const roleId = roleRes.rows[0].id;
    await this.pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, roleId],
    );
    return true;
  }

  async removeRole(userId: string, roleName: string) {
    const roleRes = await this.pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
    if (!roleRes.rows.length) return false;
    const roleId = roleRes.rows[0].id;
    await this.pool.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [
      userId,
      roleId,
    ]);
    return true;
  }
}
