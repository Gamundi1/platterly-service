import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CreateAvailableHourDto } from './availableHours/dto/create-available-hour.dto';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import type { AuthenticatedRequest } from '@shared/types/authenticated-request.type';
import { AuthGuard } from '@shared/guards/auth.guard';
import { BookingStatus } from './enum/booking-status.enum';
import { UserRole } from 'src/auth/user/enums/user-role.enum';

@Controller('v1/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() createBookingDto: CreateBookingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bookingService.createBooking(createBookingDto, request.user);
  }

  @UseGuards(AuthGuard)
  @Post('join')
  addUserToBooking(
    @Body('bookingId') bookingId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bookingService.addUserToBooking(bookingId, request.user);
  }

  @Get('my-bookings')
  @UseGuards(AuthGuard)
  getUserBookings(@Req() request: AuthenticatedRequest) {
    return this.bookingService.getUserBookings(request.user);
  }

  @UseGuards(AuthGuard)
  @Get('get/:bookingId')
  getBooking(
    @Param('bookingId') bookingId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bookingService.getBookingById(bookingId, request.user);
  }

  @UseGuards(AuthGuard)
  @Get('active/:date')
  getBookingsByDate(
    @Param('date') date: string,
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.user.role !== UserRole.HOST) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED_USER',
        label: 'unauthorized_user_error_title',
        message: 'unauthorized_user_error_message',
      });
    }
    return this.bookingService.getBookingsByDate(date);
  }

  @UseGuards(AuthGuard)
  @Post('create/available-hours')
  addAvailableHour(
    @Body() createAvailableHourDto: CreateAvailableHourDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED_USER',
        label: 'unauthorized_user_error_title',
        message: 'unauthorized_user_error_message',
      });
    }
    return this.bookingService.addAvailableHour(createAvailableHourDto);
  }

  @Get('available-hours')
  getAvailableHours() {
    return this.bookingService.getAvailableHours();
  }

  @UseGuards(AuthGuard)
  @Put('status/:bookingId')
  updateBookingStatus(
    @Param('bookingId') bookingId: string,
    @Body('status') status: BookingStatus,
    @Req() request: AuthenticatedRequest,
  ) {
    if (
      request.user.role !== UserRole.HOST &&
      request.user.role === UserRole.USER
    ) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED_USER',
        label: 'unauthorized_user_error_title',
        message: 'unauthorized_user_error_message',
      });
    }
    return this.bookingService.updateBookingAndTableStatus(
      bookingId,
      status,
      request.user,
    );
  }
}
