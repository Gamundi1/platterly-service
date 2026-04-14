import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
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
  @IsUUID('4', { each: true })
  ingredients: string[];
}
