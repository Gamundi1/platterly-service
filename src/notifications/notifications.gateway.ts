import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GetBookingOrdersDto } from 'src/order/dto/get-booking-orders.dto';
import { OrderStatus } from 'src/order/enum/order-status.enum';

@WebSocketGateway()
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinBooking')
  handleJoinBooking(
    @MessageBody() bookingId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(bookingId);
  }

  @SubscribeMessage('notifyOrderCreated')
  handleOrderCreated(@ConnectedSocket() client: Socket) {
    client.join('ordersCreated');
  }

  @SubscribeMessage('notifyOrdersUpdated')
  handleOrdersUpdated(@ConnectedSocket() client: Socket) {
    client.join('ordersUpdated');
  }

  emitToBookingUsers(bookingId: string, data: any, eventType: string) {
    this.server.to(bookingId).emit(eventType, data);
  }

  emitOrderCreated(bookingId: string, order: GetBookingOrdersDto) {
    this.server.to('ordersCreated').emit('order.created', order);
    this.emitToBookingUsers(bookingId, order, 'order.created');
  }

  emitOrderUpdated(
    bookingId: string,
    order: GetBookingOrdersDto,
    status: OrderStatus,
  ) {
    this.server.to('ordersUpdated').emit('order.updated', order, status);
    this.emitToBookingUsers(bookingId, { order, status }, 'order.updated');
  }
}
