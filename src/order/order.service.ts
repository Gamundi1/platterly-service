import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { PayOrdersDto } from './dto/pay-orders.dto';

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
      throw new BadRequestException({
        code: 'NO_PRODUCTS_IN_ORDER',
        label: 'no_products_in_order_error_title',
        message: 'no_products_in_order_error_message',
      });
    }

    const booking = await this.bookingService.getBookingById(bookingId, user);

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        label: 'booking_not_found_error_title',
        message: 'booking_not_found_error_message',
      });
    }

    if (booking.status !== 'active') {
      throw new UnauthorizedException({
        code: 'BOOKING_NOT_ACTIVE',
        label: 'booking_not_active_error_title',
        message: 'booking_not_active_error_message',
      });
    }

    const productIds = createOrderDto.products.map((item) => item.productId);
    const products = await this.menuService.getAllProductsFromId(productIds);
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const orderProducts = createOrderDto.products.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) {
        throw new BadRequestException({
          code: 'SOME_PRODUCTS_ARE_INVALID',
          label: 'some_products_are_invalid_error_title',
          message: 'some_products_are_invalid_error_message',
        });
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
      throw new BadRequestException({
        code: 'FAILED_TO_CREATE_ORDER',
        label: 'failed_to_create_order_error_title',
        message: 'failed_to_create_order_error_message',
      });
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

    if (orders.length === 0) {
      throw new NotFoundException({
        code: 'NO_ORDERS_IN_BOOKING',
        label: 'no_orders_in_booking_error_title',
        message: 'no_orders_in_booking_error_message',
      });
    }

    let totalPrice = 0;
    let orderToPay: string[] = [];

    orders.forEach((order) => {
      if (order.isPaid) {
        return;
      }

      orderToPay.push(order.id);

      order.orderProducts.forEach((product) => {
        totalPrice += product.product.price * product.quantity;
      });
    });

    return { ordersUnpaid: orderToPay, totalPrice };
  }

  async getTotalOrdersPriceByBookingIdAndUser(
    bookingId: string,
    user: User,
  ): Promise<any> {
    let orders: Order[] = await this.retrieveBookingOrders(bookingId);

    if (orders.length === 0) {
      throw new NotFoundException({
        code: 'NO_ORDERS_IN_BOOKING',
        label: 'no_orders_in_booking_error_title',
        message: 'no_orders_in_booking_error_message',
      });
    }

    let totalPrice = 0;
    let orderToPay: string[] = [];

    orders.forEach((order) => {
      if (order.isPaid) {
        return;
      }

      if (order.user.id !== user.id) {
        return;
      }

      orderToPay.push(order.id);

      order.orderProducts.forEach((product) => {
        totalPrice += product.product.price * product.quantity;
      });
    });

    return {
      ordersUnpaid: orderToPay,
      totalPrice,
    };
  }

  async payOrdersByIds(payOrderDto: PayOrdersDto): Promise<void> {
    if (payOrderDto.ordersToPay.length === 0) {
      throw new BadRequestException({
        code: 'NO_ORDERS_PROVIDED',
        label: 'no_orders_provided_error_title',
        message: 'no_orders_provided_error_message',
      });
    }

    const orders = await this.orderRepository.findByIds(
      payOrderDto.ordersToPay,
    );

    if (orders.length !== payOrderDto.ordersToPay.length) {
      throw new NotFoundException({
        code: 'SOME_ORDERS_ARE_INVALID',
        label: 'some_orders_are_invalid_error_title',
        message: 'some_orders_are_invalid_error_message',
      });
    }

    orders.forEach((order) => {
      if (order.isPaid) {
        throw new BadRequestException({
          code: 'SOME_ORDERS_ALREADY_PAID',
          label: 'some_orders_already_paid_error_title',
          message: 'some_orders_already_paid_error_message',
        });
      }
      order.isPaid = true;
    });
    try {
      await this.orderRepository.save(orders);
    } catch (error) {
      throw new BadRequestException({
        code: 'FAILED_TO_PAY_ORDERS',
        label: 'failed_to_pay_orders_error_title',
        message: 'failed_to_pay_orders_error_message',
      });
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
        label: 'failed_to_retrieve_orders_error_title',
        message: 'failed_to_retrieve_orders_error_message',
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
      relations: ['booking', 'user', 'orderProducts', 'orderProducts.product'],
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        label: 'order_not_found_error_title',
        message: 'order_not_found_error_message',
      });
    }

    if (order.orderStatus === status) {
      throw new BadRequestException({
        code: 'ORDER_STATUS_UNCHANGED',
        label: 'order_status_unchanged_error_title',
        message: 'order_status_unchanged_error_message',
      });
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
      throw new BadRequestException({
        code: 'FAILED_TO_UPDATE_ORDER_STATUS',
        label: 'failed_to_update_order_status_error_title',
        message: 'failed_to_update_order_status_error_message',
      });
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
        label: 'failed_to_retrieve_orders_error_title',
        message: 'failed_to_retrieve_orders_error_message',
      });
    }
  }
}
