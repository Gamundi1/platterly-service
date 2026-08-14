import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
      throw new BadRequestException({ code: 'NO_PRODUCTS_IN_ORDER' });
    }

    const booking = await this.bookingService.getBookingById(bookingId, user);

    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND' });
    }

    if (booking.status !== 'active') {
      throw new UnauthorizedException({ code: 'BOOKING_NOT_ACTIVE' });
    }

    const productIds = createOrderDto.products.map((item) => item.productId);
    const products = await this.menuService.getAllProductsFromId(productIds);
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const orderProducts = createOrderDto.products.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) {
        throw new BadRequestException({ code: 'SOME_PRODUCTS_ARE_INVALID' });
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
        booking: {
          table: booking.table.number,
        },
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
    const orders: Order[] = await this.retrieveBookingOrders(bookingId);
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

  async getTotalOrdersPriceByBookingId(bookingId: string): Promise<any> {
    let orders: Order[] = await this.retrieveBookingOrders(bookingId);
    let totalPrice = 0;

    orders.forEach((order) => {
      if (order.isPaid) {
        return;
      }
      order.orderProducts.forEach((product) => {
        totalPrice += product.product.price * product.quantity;
      });
    });

    if (!totalPrice) {
      throw new BadRequestException({ code: 'NO_UNPAID_ORDERS_LEFT' });
    }
    return { totalPrice };
  }

  async getTotalOrdersPriceByBookingIdAndUser(
    bookingId: string,
    user: User,
  ): Promise<any> {
    let orders: Order[] = await this.retrieveBookingOrders(bookingId);
    let totalPrice = 0;

    orders.forEach((order) => {
      if (order.isPaid) {
        return;
      }

      if (order.user.id !== user.id) {
        return;
      }

      order.orderProducts.forEach((product) => {
        totalPrice += product.product.price * product.quantity;
      });
    });

    if (!totalPrice) {
      throw new BadRequestException({ code: 'NO_UNPAID_ORDERS_LEFT' });
    }

    return { totalPrice };
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
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND' });
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
      products: order.orderProducts?.map((orderProduct) => ({
        name: orderProduct.product.name,
        price: orderProduct.product.price,
        quantity: orderProduct.quantity,
      })),
    };

    try {
      await this.orderRepository.save(order);
      this.eventEmitter.emit('order.updated', orderToEmit, order.booking.id);
    } catch (error) {
      throw new BadRequestException({ code: 'FAILED_TO_UPDATE_ORDER_STATUS' });
    }
  }

  private async retrieveBookingOrders(bookingId: string): Promise<Order[]> {
    try {
      return this.orderRepository.find({
        where: { booking: { id: bookingId } },
        relations: ['orderProducts', 'orderProducts.product', 'user'],
      });
    } catch (error) {
      throw new BadRequestException({
        code: 'FAILED_TO_RETRIEVE_ORDERS',
      });
    }
  }
}
