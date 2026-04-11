import { IsNumber, Min } from 'class-validator';

export class CreateTableDto {
  @IsNumber()
  @Min(1)
  tableNumber: number;

  @IsNumber()
  @Min(0)
  capacity: number;

  @IsNumber()
  @Min(0)
  inlinePosition: number;

  @IsNumber()
  @Min(0)
  blockPosition: number;
}
