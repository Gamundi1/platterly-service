import { IsString, IsNotEmpty } from 'class-validator';

export class CreateI18nDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  es: string;
}
