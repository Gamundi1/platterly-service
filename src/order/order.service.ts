import { BadRequestException, Injectable } from '@nestjs/common';
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
    if (createOrderDto.products.length === 0) {
      throw new BadRequestException(
        'At least one product must be included in the order.',
      );
    }

    const booking = await this.bookingService.getBookingById(bookingId);
    const products = await this.menuService.getAllProductsFromId(
      createOrderDto.products,
    );

    try {
      const order = this.orderRepository.create({
        ...createOrderDto,
        booking,
        products,
        user,
      });

      this.orderRepository.save(order);

      return order.id;
    } catch (error) {
      throw new BadRequestException('Failed to create order: ' + error.message);
    }
  }

  async getOrderById(id: string) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['products'],
      });
      if (!order) {
        throw new BadRequestException('Order not found.');
      }
      return order;
    } catch (error) {
      throw new BadRequestException(
        'Failed to retrieve order: ' + error.message,
      );
    }
  }
}
