import { Module } from '@nestjs/common';
import { ClosuresController } from './closures.controller';
import { ClosuresService } from './closures.service';
import { ClosuresRepository } from './closures.repository';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [ReservationsModule],
  controllers: [ClosuresController],
  providers: [ClosuresService, ClosuresRepository],
  exports: [ClosuresService],
})
export class ClosuresModule {}
