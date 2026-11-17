import { Controller, Post, Body, Request } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { Roles } from '../common/decorators';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Roles('ADMIN')
  @Post()
  async createTournament(@Request() req: any, @Body() dto: CreateTournamentDto) {
    return this.tournamentsService.createTournament(dto);
  }
}
