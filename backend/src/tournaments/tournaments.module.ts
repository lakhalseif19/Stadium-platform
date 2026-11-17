import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { TournamentsRepository } from './tournaments.repository';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [ReservationsModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, TournamentsRepository],
  exports: [TournamentsService],
})
export class TournamentsModule {}
