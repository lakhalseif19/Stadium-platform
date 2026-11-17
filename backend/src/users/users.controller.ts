import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    return { ...user, roles: req.user.roles ?? [] };
  }

  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'List users (Admin)' })
  findAll(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.usersService.findAll(limit ? Number(limit) : 10, offset ? Number(offset) : 0);
  }

  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin)' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Create user (Admin)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Roles('admin')
  @Put(':id')
  @ApiOperation({ summary: 'Update user (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Roles('admin')
  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle user active status (Admin)' })
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}
