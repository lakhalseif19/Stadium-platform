import { Module } from '@nestjs/common';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';
import { FieldsRepository } from './fields.repository';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [FieldsController],
  providers: [FieldsService, FieldsRepository],
  exports: [FieldsService],
})
export class FieldsModule {}
