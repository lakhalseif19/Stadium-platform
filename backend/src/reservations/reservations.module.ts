import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationsRepository } from './reservations.repository';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reservations',
    }),
  ],
  controllers: [ReservationsController, AvailabilityController],
  providers: [ReservationsService, ReservationsRepository, AvailabilityService],
  exports: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
