import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CreateProductDto } from 'src/menu/product/dto/create-product';

export class CreateDishDto extends CreateProductDto {
  @IsNumber()
  @IsPositive()
  cookTime: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images: string[];

  @IsArray()
  @IsString({ each: true })
  ingredients: string[];
}
