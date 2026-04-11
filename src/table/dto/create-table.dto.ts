import { Type } from 'class-transformer';
import { IsArray, IsNumber, Min } from 'class-validator';

export class CreateTableDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  number: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  capacity: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  inlinePosition: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  blockPosition: number;
}
