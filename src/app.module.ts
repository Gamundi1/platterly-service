import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvConfiguration } from './config/app.config';
import { JoiValidationSchema } from './config/joi.validation';
import { MenuModule } from './menu/menu.module';
import { TableModule } from './table/table.module';
import { BookingModule } from './booking/booking.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [EnvConfiguration],
      validationSchema: JoiValidationSchema,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,
    }),
    EventEmitterModule.forRoot(),
    NotificationsModule,
    TableModule,
    MenuModule,
    BookingModule,
    AuthModule,
    OrderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
