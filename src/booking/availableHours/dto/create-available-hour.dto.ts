import { IsString } from 'class-validator';

export class CreateAvailableHourDto {
  @IsString()
  interval: string;
}
