import { TableStatus } from 'src/table/enum/table-status.enum';
import { BookingStatus } from '../enum/booking-status.enum';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class GetBookingDto {
  @IsUUID()
  id: string;

  @IsNumber()
  @Min(1)
  guests: number;

  table: TableBookingDto;
  hour: AvailableHourDto;

  @IsDateString()
  date: string;

  users: UserBookingDto[];

  @IsEnum(BookingStatus)
  status: BookingStatus;
}

export class AvailableHourDto {
  @IsUUID()
  id: string;

  @IsString()
  interval: string;
}

export class TableBookingDto {
  @IsNumber()
  number: number;

  @IsEnum(TableStatus)
  status: TableStatus;
}

export class UserBookingDto {
  @IsString()
  name: string;
  
  @IsUUID()
  id: string;
}
