import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { CreateProductDto } from 'src/menu/product/dto/create-product';

export class CreateDrinkDto extends CreateProductDto {
  @IsNumber()
  @Min(1)
  volume: number;

  @IsString()
  @MinLength(1)
  units: string;

  @IsBoolean()
  isAlcoholic: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergens?: string[];
}
