import { IsUUID } from "class-validator";

export class PayOrdersDto {
  @IsUUID('4', { each: true })
  orderIds: string[];
} 