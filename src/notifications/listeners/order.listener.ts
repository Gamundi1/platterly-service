import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsGateway } from '../notifications.gateway';
import { GetBookingOrdersDto } from '../../order/dto/get-booking-orders.dto';
import { OrderStatus } from 'src/order/enum/order-status.enum';
import { UserService } from 'src/auth/user/user.service';
import { UserRole } from 'src/auth/user/enums/user-role.enum';

@Injectable()
export class OrderListener {
  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly userService: UserService,
  ) {}

  @OnEvent('order.created')
  handleOrderCreated(order: GetBookingOrdersDto, bookingId: string) {
    this.notificationsGateway.emitOrderCreated(bookingId, order);
  }

  @OnEvent('order.updated')
  handleOrderUpdated(order: GetBookingOrdersDto, bookingId: string) {
    this.notificationsGateway.emitOrderUpdated(bookingId, order);
  }
}
