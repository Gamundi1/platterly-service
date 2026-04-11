import { IsDateString, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateBookingDto {
  @IsNumber()
  @Min(1)
  guests: number;

  @IsDateString()
  date: string;

  @IsUUID()
  availableHoursId: string;
}
