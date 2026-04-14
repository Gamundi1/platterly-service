import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  surname: string;

  @IsString()
  @IsOptional()
  secondSurname?: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
