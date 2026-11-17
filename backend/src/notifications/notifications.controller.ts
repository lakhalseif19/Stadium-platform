import { Controller, Get, Post, Param, Query, Req, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Roles } from '../common/decorators';
import { Role } from '../common/enums';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req: any, @Query('limit') limit = 10, @Query('offset') offset = 0) {
    return this.notificationsService.getNotifications(req.user.id, limit, offset);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Post('read-all')
  async markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Roles(Role.ADMIN)
  @Post('send')
  async sendNotification(@Body() body: any) {
    return this.notificationsService.notifyUser(
      body.user_id,
      body.type || 'SYSTEM',
      { en: body.title_en, ar: body.title_ar, fr: body.title_fr },
      { en: body.body_en, ar: body.body_ar, fr: body.body_fr },
    );
  }
}
