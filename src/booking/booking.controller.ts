import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateAvailableHourDto } from './availableHours/dto/create-available-hour.dto';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import type { AuthenticatedRequest } from '@shared/types/authenticated-request.type';
import { AuthGuard } from '@shared/guards/auth.guard';

@Controller('v1/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body() createBookingDto: CreateBookingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bookingService.createBooking(createBookingDto, request.user);
  }

  @Post('join')
  @UseGuards(AuthGuard)
  addUserToBooking(
    @Body('bookingId') bookingId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bookingService.addUserToBooking(bookingId, request.user);
  }

  @Get('get/:bookingId')
  getBooking(@Param('bookingId') bookingId: string) {
    return this.bookingService.getBookingById(bookingId);
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
