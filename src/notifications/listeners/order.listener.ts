import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsGateway } from '../notifications.gateway';
import { GetBookingOrdersDto } from '../../order/dto/get-booking-orders.dto';
import { OrderStatus } from 'src/order/enum/order-status.enum';
import { NotificationsService } from '../notifications.service';
import { UserService } from 'src/auth/user/user.service';
import { UserRole } from 'src/auth/user/enums/user-role.enum';

@Injectable()
export class OrderListener {
  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notificationsService: NotificationsService,
    private readonly userService: UserService,
  ) {}

  @OnEvent('order.created')
  handleOrderCreated(order: GetBookingOrdersDto, bookingId: string) {
    this.notificationsGateway.emitOrderCreated(bookingId, order);

    this.userService.findUserByRole(UserRole.CHEF).then((chefs) => {
      chefs.forEach((chef) => {
        this.notificationsService.sendNotificationToUser(chef.id, {
          message: `Tienes un nuevo pedido`,
        });
      });
    });
  }

  @OnEvent('order.updated')
  handleOrderUpdated(
    order: GetBookingOrdersDto,
    bookingId: string,
    newStatus: OrderStatus,
  ) {
    this.notificationsGateway.emitOrderUpdated(bookingId, order, newStatus);
  }
}
