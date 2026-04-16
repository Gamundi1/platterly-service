import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus } from '../enum/order-status.enum';

export class CreateOrderDto {
  @IsDateString()
  @IsOptional()
  @Type(() => String)
  scheduledAt: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  status: OrderStatus;

  @IsArray()
  @IsUUID('4', { each: true })
  products: string[];
}
