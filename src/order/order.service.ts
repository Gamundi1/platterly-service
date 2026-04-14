import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { BookingService } from 'src/booking/booking.service';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MenuService } from 'src/menu/menu.service';
import { User } from 'src/auth/user/entities/user.entity';

@Injectable()
export class OrderService {
  constructor(
    private readonly bookingService: BookingService,
    private readonly menuService: MenuService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    bookingId: string,
    user: User,
  ) {
    const booking = await this.bookingService.getBookingById(bookingId);
    const products = await this.menuService.getAllProductsFromId(
      createOrderDto.products,
    );

    const order = this.orderRepository.create({
      ...createOrderDto,
      scheduledAt: Date.now(),
      booking,
      products,
      user,
    });

    return this.orderRepository.save(order);
  }
}
