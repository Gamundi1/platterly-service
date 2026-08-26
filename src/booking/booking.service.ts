import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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
import { GetBookingDto } from './dto/get-booking.dto';
import { UserRole } from 'src/auth/user/enums/user-role.enum';

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
  ): Promise<GetBookingDto> {
    return this.dataSource.transaction(async (manager) => {
      const availableHour = await manager.findOne(AvailableHours, {
        where: { id: createBookingDto.availableHoursId },
      });

      if (!availableHour) {
        throw new BadRequestException({
          code: 'INVALID_HOUR_INTERVAL',
          label: 'invalid_hour_error_title',
          message: 'invalid_hour_error_message',
        });
      }

      const table = await manager.findOne(Table, {
        where: { number: createBookingDto.tableNumber },
      });

      if (!table) {
        throw new BadRequestException({
          code: 'INVALID_TABLE_NUMBER',
          label: 'invalid_table_error_title',
          message: 'invalid_table_error_message',
        });
      }

      const booking = manager.create(Booking, {
        ...createBookingDto,
        availableHours: availableHour,
        table: table,
      });
      const savedBooking = await manager.save(booking);

      const bookingGuest = await manager.create(BookingGuest, {
        booking: savedBooking,
        user,
        owner: true,
      });

      await manager.save(bookingGuest);

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
    });
  }

  async updateBookingAndTableStatus(
    bookingId: string,
    bookingStatus: BookingStatus,
    user: User,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const bookingRepository = manager.getRepository(Booking);

      const booking = await this.getBookingById(
        bookingId,
        user,
        user.role === UserRole.HOST,
      );

      booking.status = bookingStatus;
      await this.tableService.updateTableStatus(
        booking.table.number,
        this.getTableStatusForBookingStatus(bookingStatus),
        manager,
      );

      await bookingRepository.save(booking);
    });
  }

  async getUserBookings(user: User): Promise<GetBookingDto[]> {
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
    const booking = await this.getBookingById(bookingId, user, true);

    if (booking.users.length >= booking.guests) {
      throw new BadRequestException({
        code: 'BOOKING_FULL',
        label: 'booking_full_error_title',
        message: 'booking_full_error_message',
      });
    }

    const existingGuest = booking.users.find(
      (bookingGuest) => bookingGuest.id === user.id,
    );

    if (existingGuest) {
      throw new BadRequestException({
        code: 'USER_ALREADY_IN_BOOKING',
        label: 'user_already_in_booking_error_title',
        message: 'user_already_in_booking_error_message',
      });
    }

    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.ACTIVE
    ) {
      throw new BadRequestException({
        code: 'BOOKING_NOT_ACTIVE',
        label: 'booking_not_active_error_title',
        message: 'booking_not_active_error_message',
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

  async getBookingsByDate(date: string): Promise<GetBookingDto[]> {
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
      .andWhere('booking.status != :status', {
        status: BookingStatus.CANCELLED,
      })
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

  async getBookingById(
    uuid: string,
    user: User,
    avoidVerification: boolean = false,
  ): Promise<GetBookingDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id: uuid },
      relations: {
        bookingGuests: { user: true },
        table: true,
        availableHours: true,
      },
    });
    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        label: 'booking_not_found_error_title',
        message: 'booking_not_found_error_message',
      });
    }

    if (
      !avoidVerification &&
      !booking.bookingGuests.some((guest) => guest.user.id === user.id)
    ) {
      throw new UnauthorizedException({
        code: 'USER_NOT_IN_BOOKING',
        label: 'user_not_in_booking_error_title',
        message: 'user_not_in_booking_error_message',
      });
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
        throw new BadRequestException({
          code: 'INVALID_BOOKING_STATUS',
          label: 'invalid_booking_status_error_title',
          message: 'invalid_booking_status_error_message',
        });
    }
  }
}
