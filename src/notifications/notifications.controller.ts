import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@shared/guards/auth.guard';
import type { AuthenticatedRequest } from '@shared/types/authenticated-request.type';
import { NotificationsService } from './notifications.service';

@Controller('v1/notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  async subscribe(
    @Body(new ValidationPipe({ transform: true }))
    dto: any,
    @Req() request: AuthenticatedRequest,
  ): Promise<any> {
    await this.notificationsService.subscribe(
      request.user,
      dto.subscription as any,
    );
  }

  @Delete('unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(
    @Body(new ValidationPipe({ transform: true }))
    dto: any,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.notificationsService.unsubscribe(
      request.user,
      dto.subscription as any,
    );
  }

  @Get('subscriptions')
  @HttpCode(HttpStatus.OK)
  async getSubscriptions(@Req() request: AuthenticatedRequest): Promise<any[]> {
    return await this.notificationsService.getUserSubscriptions(request.user);
  }
}
