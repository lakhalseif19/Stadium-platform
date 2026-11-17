import { Module } from '@nestjs/common';
import { StadiumsController } from './stadiums.controller';
import { StadiumsService } from './stadiums.service';
import { StadiumsRepository } from './stadiums.repository';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [StadiumsController],
  providers: [StadiumsService, StadiumsRepository],
  exports: [StadiumsService],
})
export class StadiumsModule {}
