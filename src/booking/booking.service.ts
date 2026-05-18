import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/user/entities/user.entity';
import { Table } from 'src/table/entities/table.entity';
import { TableStatus } from 'src/table/enum/table-status.enum';
import { TableService } from 'src/table/table.service';
import { DataSource, Repository } from 'typeorm';
import { CreateAvailableHourDto } from './availableHours/dto/create-available-hour.dto';
import { AvailableHours } from './availableHours/entities/available-hours.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingGuest } from './entities/booking-guests.entity';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from './enum/booking-status.enum';
import { BookingInterface } from './interfaces/booking.interface';

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

    private readonly dataSource: DataSource,
  ) {}

  async createBooking(
    createBookingDto: CreateBookingDto,
    user: User,
  ): Promise<BookingInterface> {
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
      table: {
        number: table.number,
        status: table.status,
      },
      hour: availableHour,
      users: [
        {
          name: user.name,
          id: user.id,
        },
      ],
      status: savedBooking.status,
    };
  }

  async updateBookingAndTableStatus(
    bookingId: string,
    bookingStatus: BookingStatus,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const bookingRepository = manager.getRepository(Booking);

      const booking = await bookingRepository.findOne({
        where: { id: bookingId },
        relations: { table: true },
      });

      if (!booking) {
        throw new BadRequestException({
          code: 'BOOKING_NOT_FOUND',
        });
      }

      booking.status = bookingStatus;
      await this.tableService.updateTableStatus(
        booking.table.number,
        this.getTableStatusForBookingStatus(bookingStatus),
        manager,
      );

      await bookingRepository.save(booking);
    });
  }

  async getUserBookings(user: User): Promise<BookingInterface[]> {
    const userBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.bookingGuests', 'filterGuests')
      .innerJoin('filterGuests.user', 'filterUser', 'filterUser.id = :userId', {
        userId: user.id,
      })
      .leftJoinAndSelect('booking.table', 'table')
      .leftJoinAndSelect('booking.availableHours', 'availableHours')
      .leftJoinAndSelect('booking.bookingGuests', 'bookingGuests')
      .leftJoinAndSelect('bookingGuests.user', 'guestUser')
      .getMany();

    return userBookings.map((booking) => ({
      id: booking.id,
      date: booking.date,
      guests: booking.guests,
      table: {
        number: booking.table.number,
        status: booking.table.status,
      },
      hour: booking.availableHours,
      users: booking.bookingGuests.map((guest) => ({
        name: guest.user.name,
        id: guest.user.id,
      })),
      status: booking.status,
    }));
  }

  async addUserToBooking(bookingId: string, user: User) {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      throw new BadRequestException({
        code: 'BOOKING_NOT_FOUND',
      });
    }

    if (booking.users.length >= booking.guests) {
      throw new BadRequestException({
        code: 'BOOKING_FULL',
      });
    }

    const existingGuest = booking.users.find(
      (bookingGuest) => bookingGuest.id === user.id,
    );

    if (existingGuest) {
      throw new BadRequestException({
        code: 'USER_ALREADY_IN_BOOKING',
      });
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

  async getBookingsByDate(date: string): Promise<BookingInterface[]> {
    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.table', 'table')
      .leftJoin('booking.availableHours', 'availableHours')
      .leftJoin('booking.bookingGuests', 'bookingGuests')
      .leftJoin('bookingGuests.user', 'guestUser')
      .select([
        'booking.id AS id',
        'booking.guests AS guests',
        'booking.date AS date',
        'booking.status AS status',
        'availableHours.interval AS interval',
        'availableHours.id AS availableHourId',
        'table.number AS tableNumber',
        'table.status AS tableStatus',
        'ARRAY_AGG(guestUser.id) FILTER (WHERE bookingGuests.owner = true) AS ownerIds',
        'ARRAY_AGG(guestUser.name) FILTER (WHERE bookingGuests.owner = true) AS ownerNames',
        'ARRAY_AGG(guestUser.surname) FILTER (WHERE bookingGuests.owner = true) AS ownerSurnames',
      ])
      .where('booking.date = :date', { date })
      .groupBy('booking.id')
      .addGroupBy('availableHours.interval')
      .addGroupBy('availableHours.id')
      .addGroupBy('table.number')
      .addGroupBy('table.status')
      .getRawMany();

    return bookings.map((booking) => ({
      id: booking.id,
      guests: booking.guests,
      date: booking.date,
      table: { number: booking.tablenumber, status: booking.tablestatus },
      hour: { id: booking.availablehourid, interval: booking.interval },
      users: [
        {
          name: `${booking.ownernames?.[0] ?? ''} ${booking.ownersurnames?.[0] ?? ''}`.trim(),
          id: booking.ownerids?.[0],
        },
      ],
      status: booking.status,
    }));
  }

  async getBookingById(uuid: string): Promise<BookingInterface> {
    const booking = await this.bookingRepository.findOne({
      where: { id: uuid },
      relations: {
        bookingGuests: { user: true },
        table: true,
        availableHours: true,
      },
    });
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    return {
      id: booking.id,
      date: booking.date,
      guests: booking.guests,
      table: {
        number: booking.table.number,
        status: booking.table.status,
      },
      hour: booking.availableHours,
      users: booking.bookingGuests.map((guest) => ({
        name: guest.user.name,
        id: guest.user.id,
      })),

      status: booking.status,
    };
  }

  private getTableStatusForBookingStatus(
    bookingStatus: BookingStatus,
  ): TableStatus {
    switch (bookingStatus) {
      case BookingStatus.ACTIVE:
        return TableStatus.OCCUPIED;
      case BookingStatus.CANCELLED:
      case BookingStatus.COMPLETED:
        return TableStatus.NEEDS_CLEANING;
      default:
        throw new BadRequestException('Invalid booking status');
    }
  }
}
