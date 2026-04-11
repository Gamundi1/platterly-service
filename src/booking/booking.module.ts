import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { AvailableHours } from './availableHours/entities/available-hours.entity';

@Module({
  controllers: [BookingController],
  imports: [TypeOrmModule.forFeature([Booking, AvailableHours])],
  providers: [BookingService],
})
export class BookingModule {}
