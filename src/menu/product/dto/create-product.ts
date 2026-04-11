import { IsNumber, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @MinLength(2)
  priceUnits: string;
}
