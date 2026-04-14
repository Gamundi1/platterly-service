import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsUUID, Min } from 'class-validator';
import { BookingStatus } from '../enum/booking-status.enum';

export class CreateBookingDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  guests: number;

  @IsDateString()
  date: string;

  @IsEnum(BookingStatus)
  status: BookingStatus;

  @IsUUID()
  availableHoursId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  tableNumber: number;
}
