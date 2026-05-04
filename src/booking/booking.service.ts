import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Table } from 'src/table/entities/table.entity';
import { Repository } from 'typeorm';
import { CreateAvailableHourDto } from './availableHours/dto/create-available-hour.dto';
import { AvailableHours } from './availableHours/entities/available-hours.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingGuest } from './entities/booking-guests.entity';
import { Booking } from './entities/booking.entity';
import { TableService } from 'src/table/table.service';
import { User } from 'src/auth/user/entities/user.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(AvailableHours)
    private readonly availableHoursRepository: Repository<AvailableHours>,

    @InjectRepository(BookingGuest)
    private readonly bookingGuestRepository: Repository<BookingGuest>,

    @Inject(forwardRef(() => TableService))
    private readonly tableService: TableService,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto, user: User) {
    let availableHour: AvailableHours | null;
    let table: Table | null;

    availableHour = await this.availableHoursRepository.findOne({
      where: { id: createBookingDto.availableHoursId },
    });

    if (!availableHour) {
      throw new BadRequestException('Invalid hour interval');
    }

    table = await this.tableService.findOne(createBookingDto.tableNumber);

    if (!table) {
      throw new BadRequestException('Invalid table number');
    }

    const booking = this.bookingRepository.create({
      ...createBookingDto,
      availableHours: availableHour,
      table: table,
    });
    const savedBooking = await this.bookingRepository.save(booking);

    const bookingGuest = await this.bookingGuestRepository.create({
      booking: savedBooking,
      user,
      owner: true,
    });

    await this.bookingGuestRepository.save(bookingGuest);

    return {
      id: savedBooking.id,
      date: savedBooking.date,
      guests: savedBooking.guests,
      tableNumber: table.number,
    };
  }

  async addUserToBooking(bookingId: string, user: User) {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    const existingGuest = booking.bookingGuests.find(
      (bookingGuest) => bookingGuest.user === user,
    );

    if (existingGuest) {
      throw new BadRequestException('User is already part of the booking');
    }

    if (booking.bookingGuests.length >= booking.guests) {
      throw new BadRequestException('Booking is already full');
    }

    const bookingGuest = await this.bookingGuestRepository.create({
      booking,
      user,
      owner: false,
    });

    return this.bookingGuestRepository.save(bookingGuest);
  }

  addAvailableHour(createAvailableHourDto: CreateAvailableHourDto) {
    const availableHour = this.availableHoursRepository.create(
      createAvailableHourDto,
    );
    return this.availableHoursRepository.save(availableHour);
  }

  getAvailableHours() {
    return this.availableHoursRepository.find();
  }

  async getBookingsByDate(date: string) {
    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.table', 'table')
      .leftJoin('booking.availableHours', 'availableHours')
      .select([
        'booking.id AS id',
        'booking.guests AS guests',
        'booking.date AS date',
        'booking.status AS status',
        'availableHours.id AS availableHoursId',
        'table.number AS tableNumber',
      ])
      .where('booking.date = :date', { date })
      .getRawMany();

    return bookings;
  }

  async getBookingById(uuid: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id: uuid },
      relations: {
        bookingGuests: true,
      },
    });
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }
    return booking;
  }
}
