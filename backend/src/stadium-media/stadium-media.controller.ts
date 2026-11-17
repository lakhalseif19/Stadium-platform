import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StadiumMediaService } from './stadium-media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Public, Permissions } from '../common/decorators';
import { Permission } from '../common/enums';

@ApiTags('stadium-media')
@Controller('stadium-media')
export class StadiumMediaController {
  constructor(private readonly stadiumMediaService: StadiumMediaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List media by stadium' })
  async findByStadium(@Query('stadium_id') stadium_id: string) {
    return this.stadiumMediaService.findByStadium(stadium_id);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_STADIUMS)
  @Post()
  @ApiOperation({ summary: 'Create stadium media' })
  async create(@Body() dto: CreateMediaDto, @Req() req: any) {
    return this.stadiumMediaService.create(dto, req.user?.id, req.ip);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_STADIUMS)
  @Put(':id')
  @ApiOperation({ summary: 'Update stadium media' })
  async update(@Param('id') id: string, @Body() dto: UpdateMediaDto, @Req() req: any) {
    return this.stadiumMediaService.update(id, dto, req.user?.id, req.ip);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_STADIUMS)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete stadium media' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.stadiumMediaService.delete(id, req.user?.id, req.ip);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_STADIUMS)
  @Patch(':id/set-primary')
  @ApiOperation({ summary: 'Set media as primary' })
  async setPrimary(@Param('id') id: string, @Req() req: any) {
    return this.stadiumMediaService.setPrimary(id, req.user?.id, req.ip);
  }
}
