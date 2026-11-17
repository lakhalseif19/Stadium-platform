import { Controller, Post, Get, Body, Param, Request, Delete } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Roles } from '../common/decorators';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('mine')
  findMine(@Request() req: any) {
    return this.reservationsService.findForUser(req.user.id);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.reservationsService.findAllForAdmin();
  }

  @Post()
  async createReservation(@Request() req: any, @Body() dto: CreateReservationDto) {
    const userId = req.user.id;
    const isAdmin = req.user.roles?.includes('ADMIN');
    return this.reservationsService.createReservation(dto, userId, isAdmin);
  }

  @Delete(':id/cancel')
  async cancelReservation(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.cancelReservation(id, req.user.id);
  }
}
