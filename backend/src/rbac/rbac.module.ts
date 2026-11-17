import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacRepository } from './rbac.repository';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  providers: [RbacService, RbacRepository, RolesGuard, PermissionsGuard],
  exports: [RbacService, RolesGuard, PermissionsGuard],
})
export class RbacModule {}
