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
import { Booking } from './entities/booking.entity';
import { TableService } from 'src/table/table.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(AvailableHours)
    private readonly availableHoursRepository: Repository<AvailableHours>,

    @Inject(forwardRef(() => TableService))
    private readonly tableService: TableService,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto) {
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
    this.bookingRepository.save(booking);

    return booking;
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
}
