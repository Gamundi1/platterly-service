import { IsArray, IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus } from '../enum/order-status.enum';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  scheduledAt: number;

  @IsEnum(OrderStatus)
  @IsOptional()
  status: OrderStatus;

  @IsUUID()
  bookingId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  products: string[];
}
