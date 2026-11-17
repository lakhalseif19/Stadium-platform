import { Module } from '@nestjs/common';
import { StadiumMediaController } from './stadium-media.controller';
import { StadiumMediaService } from './stadium-media.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [StadiumMediaController],
  providers: [StadiumMediaService],
  exports: [StadiumMediaService],
})
export class StadiumMediaModule {}
