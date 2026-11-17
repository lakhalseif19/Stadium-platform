import { Controller, Post, Body, Request, Get } from '@nestjs/common';
import { ClosuresService } from './closures.service';
import { CreateClosureDto } from './dto/create-closure.dto';
import { Roles } from '../common/decorators';

@Controller('closures')
export class ClosuresController {
  constructor(private readonly closuresService: ClosuresService) {}

  @Roles('ADMIN')
  @Post()
  async createClosure(@Request() req: any, @Body() dto: CreateClosureDto) {
    return this.closuresService.createClosure(dto);
  }

  @Roles('ADMIN')
  @Get()
  async listClosures() {
    return this.closuresService.listClosures();
  }
}
