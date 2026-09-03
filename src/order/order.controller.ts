import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@shared/guards/auth.guard';
import type { AuthenticatedRequest } from '@shared/types/authenticated-request.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { OrderStatus } from './enum/order-status.enum';
import { UserRole } from 'src/auth/user/enums/user-role.enum';
import { PayOrdersDto } from './dto/pay-orders.dto';

@Controller('v1/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AuthGuard)
  @Post('create/:bookingId')
  createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.createOrder(
      createOrderDto,
      bookingId,
      request.user,
    );
  }

  @UseGuards(AuthGuard)
  @Get('booking/:bookingId')
  getOrdersByBookingId(@Param('bookingId', ParseUUIDPipe) bookingId: string) {
    return this.orderService.getOrdersByBookingId(bookingId);
  }

  @UseGuards(AuthGuard)
  @Get('total-price/:bookingId')
  getTotalOrdersPriceByBookingId(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ) {
    return this.orderService.getTotalOrdersPriceByBookingId(bookingId);
  }

  @UseGuards(AuthGuard)
  @Get('retrieve/:bookingId')
  getUserOrdersTotalPrice(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.getTotalOrdersPriceByBookingIdAndUser(
      bookingId,
      request.user,
    );
  }

  @UseGuards(AuthGuard)
  @Put('update-status')
  updateOrderStatus(
    @Body('orderId', ParseUUIDPipe) orderId: string,
    @Body('status') status: OrderStatus,
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.user.role === UserRole.USER) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED_USER',
        label: 'unauthorized_user_error_title',
        message: 'unauthorized_user_error_message',
      });
    }

    return this.orderService.updateOrderStatus(orderId, status);
  }

  @UseGuards(AuthGuard)
  @Put('pay')
  payOrdersById(
    @Body() ordersToPay: PayOrdersDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.user.role !== UserRole.USER) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED_USER',
        label: 'unauthorized_user_error_title',
        message: 'unauthorized_user_error_message',
      });
    }

    return this.orderService.payOrdersByIds(ordersToPay);
  }

  @UseGuards(AuthGuard)
  @Get('date/:date')
  getOrdersByDate(
    @Param('date') date: string,
    @Req() request: AuthenticatedRequest,
  ) {
    if (
      request.user.role !== UserRole.WAITER &&
      request.user.role !== UserRole.CHEF
    ) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED_USER',
        label: 'unauthorized_user_error_title',
        message: 'unauthorized_user_error_message',
      });
    }
    return this.orderService.getOrdersByDate(date);
  }
}
