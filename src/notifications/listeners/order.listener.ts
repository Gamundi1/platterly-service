import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GetBookingOrdersDto } from '../../order/dto/get-booking-orders.dto';
import { NotificationsGateway } from '../notifications.gateway';

@Injectable()
export class OrderListener {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  @OnEvent('order.created')
  handleOrderCreated(order: GetBookingOrdersDto, bookingId: string) {
    this.notificationsGateway.emitOrderCreated(bookingId, order);
  }

  @OnEvent('order.updated')
  handleOrderUpdated(order: GetBookingOrdersDto, bookingId: string) {
    this.notificationsGateway.emitOrderUpdated(bookingId, order);
  }
}
