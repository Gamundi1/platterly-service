import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { OrderStatus } from '../enum/order-status.enum';

export class GetBookingOrdersDto {
  @IsUUID()
  id: string;

  @IsEnum(OrderStatus)
  status: OrderStatus;

  scheduledAt: Date;

  @IsOptional()
  deliveredAt?: Date;

  user: UserOrderDto;

  products: ProductOrderDto[];

  booking?: BookingOrderDto;
}

class UserOrderDto {
  @IsString()
  name: string;
  @IsString()
  surname: string;
}

class BookingOrderDto {
  table: number;
}

class ProductOrderDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;
}
