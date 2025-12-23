import { JwtGuard } from '@app/common/guards/jwt.guard';
import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './notificatio.dto';


@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationController {

    constructor(
        private readonly notificationService: NotificationService,
    ) {}

    @Get()
  async findAll(@Req() req) {

    const userId = req.user.userId;
    return this.notificationService.findAllByUser(userId);
  }

  @Post()
  async create(@Body() createDto: CreateNotificationDto) {
    return this.notificationService.create(createDto);
  }

  
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }


  @Patch('read-all')
  async markAllRead(@Req() req) {
    const userId = req.user.userId;
    return this.notificationService.markAllRead(userId);
  }
}
