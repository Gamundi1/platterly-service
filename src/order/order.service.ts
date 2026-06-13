import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/user/entities/user.entity';
import { BookingService } from 'src/booking/booking.service';
import { MenuService } from 'src/menu/menu.service';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetBookingOrdersDto } from './dto/get-booking-orders.dto';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enum/order-status.enum';

@Injectable()
export class OrderService {
  constructor(
    private readonly bookingService: BookingService,
    private readonly menuService: MenuService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    bookingId: string,
    user: User,
  ) {
    if (createOrderDto.products.length === 0) {
      throw new BadRequestException({ code: 'NO_PRODUCTS_PROVIDED' });
    }

    const booking = await this.bookingService.getBookingById(bookingId, user);

    if (!booking) {
      throw new BadRequestException({ code: 'BOOKING_NOT_FOUND' });
    }

    if (booking.status !== 'active') {
      throw new BadRequestException({ code: 'BOOKING_NOT_ACTIVE' });
    }

    const productIds = createOrderDto.products.map((item) => item.productId);
    const products = await this.menuService.getAllProductsFromId(productIds);
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const orderProducts = createOrderDto.products.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) {
        throw new BadRequestException({ code: 'INVALID_PRODUCTS_ID' });
      }
      return {
        product,
        quantity: item.quantity,
      };
    });

    try {
      const { products: _ignoredProducts, ...orderData } = createOrderDto;
      const order = this.orderRepository.create({
        ...orderData,
        booking,
        orderProducts,
        user,
      });

      await this.orderRepository.save(order);

      let orderToEmit: GetBookingOrdersDto = {
        id: order.id,
        status: order.orderStatus,
        scheduledAt: order.scheduledAt,
        user: {
          name: order.user.name,
          surname: order.user.surname,
        },
        products: order.orderProducts.map((orderProduct) => ({
          name: orderProduct.product.name,
          price: orderProduct.product.price,
          quantity: orderProduct.quantity,
        })),
      };

      this.eventEmitter.emit('order.created', orderToEmit, booking.id);

      return { id: order.id };
    } catch (error) {
      throw new BadRequestException({ code: 'FAILED_TO_CREATE_ORDER' });
    }
  }

  async getOrdersByBookingId(
    bookingId: string,
  ): Promise<GetBookingOrdersDto[]> {
    let orders: Order[] | null;
    try {
      orders = await this.orderRepository.find({
        where: { booking: { id: bookingId } },
        relations: ['orderProducts', 'orderProducts.product', 'user'],
      });
    } catch (error) {
      throw new BadRequestException({
        code: 'FAILED_TO_RETRIEVE_ORDERS',
      });
    }
    return orders.map((order) => {
      return {
        id: order.id,
        status: order.orderStatus,
        scheduledAt: order.scheduledAt,
        user: {
          name: order.user.name,
          surname: order.user.surname,
        },
        deliveredAt: order.deliveredAt,
        products: order.orderProducts.map((orderProduct) => ({
          name: orderProduct.product.name,
          price: orderProduct.product.price,
          quantity: orderProduct.quantity,
        })),
      };
    });
  }

  async getOrderById(id: string): Promise<GetBookingOrdersDto> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['orderProducts', 'orderProducts.product'],
      });
      if (!order) {
        throw new BadRequestException({ code: 'ORDER_NOT_FOUND' });
      }
      return {
        id: order.id,
        status: order.orderStatus,
        scheduledAt: order.scheduledAt,
        user: {
          name: order.user.name,
          surname: order.user.surname,
        },
        products: order.orderProducts.map((orderProduct) => ({
          name: orderProduct.product.name,
          price: orderProduct.product.price,
          quantity: orderProduct.quantity,
        })),
      };
    } catch (error) {
      throw new BadRequestException({ code: 'FAILED_TO_RETRIEVE_ORDER' });
    }
  }

  async getOrdersByDate(date: string): Promise<GetBookingOrdersDto[]> {
    let orders: Order[] | null;
    try {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      orders = await this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.orderProducts', 'orderProducts')
        .leftJoinAndSelect('orderProducts.product', 'product')
        .leftJoinAndSelect('order.user', 'user')
        .leftJoinAndSelect('order.booking', 'booking')
        .leftJoinAndSelect('booking.table', 'table')
        .where(
          'order.scheduledAt >= :startDate AND order.scheduledAt < :endDate',
          {
            startDate,
            endDate,
          },
        )
        .getMany();
    } catch (error) {
      throw new BadRequestException({
        code: 'FAILED_TO_RETRIEVE_ORDERS',
      });
    }

    return orders.map((order) => {
      return {
        id: order.id,
        status: order.orderStatus,
        scheduledAt: order.scheduledAt,
        user: {
          name: order.user.name,
          surname: order.user.surname,
        },
        products: order.orderProducts.map((orderProduct) => ({
          name: orderProduct.product.name,
          price: orderProduct.product.price,
          quantity: orderProduct.quantity,
        })),
        deliveredAt: order.deliveredAt,
        booking: {
          table: order.booking.table.number,
        },
      };
    });
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['booking', 'user'],
    });

    if (!order) {
      throw new BadRequestException({ code: 'ORDER_NOT_FOUND' });
    }

    if (order.orderStatus === status) {
      throw new BadRequestException({ code: 'ORDER_STATUS_UNCHANGED' });
    }

    order.orderStatus = status;

    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    let orderToEmit: GetBookingOrdersDto = {
      id: order.id,
      status: order.orderStatus,
      scheduledAt: order.scheduledAt,
      user: {
        name: order.user.name,
        surname: order.user.surname,
      },
      deliveredAt: order.deliveredAt,
      products: [],
    };

    try {
      await this.orderRepository.save(order);
      this.eventEmitter.emit(
        'order.updated',
        orderToEmit,
        order.booking.id,
        status,
      );
    } catch (error) {
      throw new BadRequestException({ code: 'FAILED_TO_UPDATE_ORDER_STATUS' });
    }
  }
}
