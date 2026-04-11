import { Type } from 'class-transformer';
import { IsArray, IsDate, IsOptional, IsString } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  name: string;

  @IsDate()
  @Type(() => Date)
  availableFrom: Date;

  @IsDate()
  @Type(() => Date)
  availableTo: Date;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  products?: string[];
}
