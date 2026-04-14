import {
  Body,
  Controller,
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
}
