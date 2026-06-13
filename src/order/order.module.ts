import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { BookingModule } from 'src/booking/booking.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { MenuModule } from 'src/menu/menu.module';
import { AuthModule } from 'src/auth/auth.module';
import { OrderProduct } from './entities/order-product.entity';

@Module({
  controllers: [OrderController],
  providers: [OrderService],
  imports: [
    BookingModule,
    TypeOrmModule.forFeature([Order, OrderProduct]),
    MenuModule,
    AuthModule,
  ],
})
export class OrderModule {}
