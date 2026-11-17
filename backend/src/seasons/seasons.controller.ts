import { Controller, Get, Post, Put, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SeasonsService } from './seasons.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { Public, Permissions } from '../common/decorators';
import { Permission } from '../common/enums';

@ApiTags('seasons')
@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Get current active season' })
  async getActiveSeason() {
    return this.seasonsService.getActiveSeason();
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all seasons' })
  async findAll() {
    return this.seasonsService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get season by id' })
  async findById(@Param('id') id: string) {
    return this.seasonsService.findById(id);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_PRICING)
  @Post()
  @ApiOperation({ summary: 'Create season' })
  async create(@Body() dto: CreateSeasonDto, @Req() req: any) {
    return this.seasonsService.create(dto, req.user?.id, req.ip);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_PRICING)
  @Put(':id')
  @ApiOperation({ summary: 'Update season' })
  async update(@Param('id') id: string, @Body() dto: UpdateSeasonDto, @Req() req: any) {
    return this.seasonsService.update(id, dto, req.user?.id, req.ip);
  }
}
