import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

enum BookingStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export class CreateBookingDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  guests: number;

  @IsDateString()
  date: string;

  @IsEnum(BookingStatus)
  status: string;

  @IsUUID()
  availableHoursId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  tableNumber: number;
}
