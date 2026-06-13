import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { OrderListener } from './listeners/order.listener';
import { NotificationEntity } from './entities/notifications.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    ConfigModule,
    AuthModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService, OrderListener],
})
export class NotificationsModule {}
