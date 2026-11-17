import { Controller, Post, Body, Request } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { Roles } from '../common/decorators';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Roles('ADMIN')
  @Post()
  async createTeam(@Request() req: any, @Body() dto: CreateTeamDto) {
    return this.teamsService.createTeam(dto);
  }
}
