import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { OrderListener } from './listeners/order.listener';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [NotificationsGateway, OrderListener],
})
export class NotificationsModule {}
