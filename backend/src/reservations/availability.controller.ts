import { Controller, Get, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { Public } from '../common/decorators';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Public()
  @Get()
  async getAvailability(@Query() query: AvailabilityQueryDto) {
    return this.availabilityService.getAvailability(query.field_id, query.date);
  }
}
