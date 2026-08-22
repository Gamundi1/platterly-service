import { Type } from 'class-transformer';
import { IsArray, IsDate, IsUUID } from 'class-validator';

export class UpdateMenuDto {
  @IsUUID('4')
  id: string;

  @IsDate()
  @Type(() => Date)
  availableFrom: Date;

  @IsDate()
  @Type(() => Date)
  availableTo: Date;

  @IsArray()
  @IsUUID('4', { each: true })
  products: string[];
}
