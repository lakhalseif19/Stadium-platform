import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { Public, Permissions } from '../common/decorators';
import { Permission } from '../common/enums';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List pricing' })
  @ApiQuery({ name: 'field_id', required: false })
  @ApiQuery({ name: 'season_id', required: false })
  async findByFilter(@Query('field_id') field_id?: string, @Query('season_id') season_id?: string) {
    return this.pricingService.findByFilter(field_id, season_id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get pricing by id' })
  async findById(@Param('id') id: string) {
    return this.pricingService.findById(id);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_PRICING)
  @Post()
  @ApiOperation({ summary: 'Create pricing' })
  async create(@Body() dto: CreatePricingDto, @Req() req: any) {
    return this.pricingService.create(dto, req.user?.id, req.ip);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_PRICING)
  @Put(':id')
  @ApiOperation({ summary: 'Update pricing' })
  async update(@Param('id') id: string, @Body() dto: UpdatePricingDto, @Req() req: any) {
    return this.pricingService.update(id, dto, req.user?.id, req.ip);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_PRICING)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete pricing' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.pricingService.delete(id, req.user?.id, req.ip);
  }
}
