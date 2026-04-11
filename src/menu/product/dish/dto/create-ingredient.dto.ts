import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergens?: string[];
}
