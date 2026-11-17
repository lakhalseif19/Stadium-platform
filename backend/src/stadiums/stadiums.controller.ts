import { Controller, Get, Post, Put, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StadiumsService } from './stadiums.service';
import { CreateStadiumDto } from './dto/create-stadium.dto';
import { UpdateStadiumDto } from './dto/update-stadium.dto';
import { SearchStadiumsDto } from './dto/search-stadiums.dto';
import { Public, Permissions } from '../common/decorators';
import { Permission } from '../common/enums';

@ApiTags('stadiums')
@Controller('stadiums')
export class StadiumsController {
  constructor(private readonly stadiumsService: StadiumsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search and list stadiums' })
  async findAll(@Query() searchDto: SearchStadiumsDto) {
    return this.stadiumsService.findAll(searchDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a stadium by id' })
  async findById(@Param('id') id: string) {
    return this.stadiumsService.findById(id);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_STADIUMS)
  @Post()
  @ApiOperation({ summary: 'Create a new stadium' })
  async create(@Body() dto: CreateStadiumDto, @Req() req: any) {
    return this.stadiumsService.create(dto, req.user?.id, req.ip);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_STADIUMS)
  @Put(':id')
  @ApiOperation({ summary: 'Update a stadium' })
  async update(@Param('id') id: string, @Body() dto: UpdateStadiumDto, @Req() req: any) {
    return this.stadiumsService.update(id, dto, req.user?.id, req.ip);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_STADIUMS)
  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle stadium active status' })
  async toggleActive(@Param('id') id: string, @Req() req: any) {
    return this.stadiumsService.toggleActive(id, req.user?.id, req.ip);
  }
}
