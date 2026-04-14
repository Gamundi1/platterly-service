import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateAvailableHourDto } from './availableHours/dto/create-available-hour.dto';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('v1/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.createBooking(createBookingDto);
  }

  @Get('active/:date')
  getBookingsByDate(@Param('date') date: string) {
    return this.bookingService.getBookingsByDate(date);
  }

  @Post('create/available-hours')
  addAvailableHour(@Body() createAvailableHourDto: CreateAvailableHourDto) {
    return this.bookingService.addAvailableHour(createAvailableHourDto);
  }

  @Get('available-hours')
  getAvailableHours() {
    return this.bookingService.getAvailableHours();
  }
}
