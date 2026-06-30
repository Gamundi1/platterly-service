import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@shared/guards/auth.guard';
import type { AuthenticatedRequest } from '@shared/types/authenticated-request.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { OrderStatus } from './enum/order-status.enum';

@Controller('v1/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('create/:bookingId')
  @UseGuards(AuthGuard)
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

  @Get('booking/:bookingId')
  @UseGuards(AuthGuard)
  getOrdersByBookingId(@Param('bookingId', ParseUUIDPipe) bookingId: string) {
    return this.orderService.getOrdersByBookingId(bookingId);
  }

  @Get('total-price/:bookingId')
  @UseGuards(AuthGuard)
  getTotalOrdersPriceByBookingId(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ) {
    return this.orderService.getTotalOrdersPriceByBookingId(bookingId);
  }

  @Get('retrieve/:bookingId')
  @UseGuards(AuthGuard)
  getUserOrdersTotalPrice(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.getTotalOrdersPriceByBookingIdAndUser(
      bookingId,
      request.user,
    );
  }

  @Post('update-status')
  @UseGuards(AuthGuard)
  updateOrderStatus(
    @Body('orderId', ParseUUIDPipe) orderId: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.orderService.updateOrderStatus(orderId, status);
  }

  @Get('get/:id')
  @UseGuards(AuthGuard)
  getOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.getOrderById(id);
  }

  @Get('date/:date')
  @UseGuards(AuthGuard)
  getOrdersByDate(@Param('date') date: string) {
    return this.orderService.getOrdersByDate(date);
  }
}
