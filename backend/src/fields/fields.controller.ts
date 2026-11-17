import { Controller, Get, Post, Put, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { Public, Permissions } from '../common/decorators';
import { Permission } from '../common/enums';

@ApiTags('fields')
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List fields by stadium' })
  async findByStadium(@Query('stadium_id') stadium_id: string) {
    return this.fieldsService.findByStadium(stadium_id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get field by id' })
  async findById(@Param('id') id: string) {
    return this.fieldsService.findById(id);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_FIELDS)
  @Post()
  @ApiOperation({ summary: 'Create field' })
  async create(@Body() dto: CreateFieldDto, @Req() req: any) {
    return this.fieldsService.create(dto, req.user?.id, req.ip);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_FIELDS)
  @Put(':id')
  @ApiOperation({ summary: 'Update field' })
  async update(@Param('id') id: string, @Body() dto: UpdateFieldDto, @Req() req: any) {
    return this.fieldsService.update(id, dto, req.user?.id, req.ip);
  }

  @ApiBearerAuth()
  @Permissions(Permission.MANAGE_FIELDS)
  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle field active status' })
  async toggleActive(@Param('id') id: string, @Req() req: any) {
    return this.fieldsService.toggleActive(id, req.user?.id, req.ip);
  }
}
