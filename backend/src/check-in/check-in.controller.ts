import { Controller, Post, Body, Req } from '@nestjs/common';
import { CheckInService } from './check-in.service';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { ScanQrDto } from './dto/scan-qr.dto';
import { Roles, Permissions } from '../common/decorators';
import { Role } from '../common/enums';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('check-in')
@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Roles(Role.CITIZEN)
  @Post('qr')
  async generateQr(@Body() dto: GenerateQrDto, @Req() req: any) {
    return this.checkInService.generateQr(req.user.id, dto.reservation_id);
  }

  @Roles(Role.GUARD)
  @Permissions('SCAN_RESERVATION', 'CHECK_IN')
  @Post('scan')
  async scanQr(@Body() dto: ScanQrDto, @Req() req: any) {
    return this.checkInService.scanQr(req.user.id, dto.token);
  }
}
