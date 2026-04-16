import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailableHours } from './availableHours/entities/available-hours.entity';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { TableModule } from 'src/table/table.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [BookingController],
  imports: [
    TypeOrmModule.forFeature([Booking, AvailableHours]),
    forwardRef(() => TableModule),
    AuthModule,
  ],
  providers: [BookingService],
  exports: [BookingService, TypeOrmModule],
})
export class BookingModule {}
