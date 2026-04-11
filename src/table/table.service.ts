import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTableDto } from './dto/create-table.dto';
import { Table } from './entities/table.entity';
import { Booking } from 'src/booking/entities/booking.entity';
import { BookingService } from 'src/booking/booking.service';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,

    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
  ) {}

  createTable(newTable: CreateTableDto) {
    try {
      const table = this.tableRepository.create(newTable);
      return this.tableRepository.save(table);
    } catch (error) {
      throw new BadRequestException('Table does already exist');
    }
  }

  findOne(tableNumber: number) {
    try {
      return this.tableRepository.findOne({
        where: { number: tableNumber },
      });
    } catch (error) {
      throw new BadRequestException('Table not found');
    }
  }

  async findAllAvailableTablesByDate(date: string) {
    const bookings = await this.mapBookingsToTableNumbers(date);
    const availableHours = await this.bookingService.getAvailableHours();
    const tables = await this.tableRepository.find();

    const availableTables = tables.map((table) => {
      let bookingsForTable = bookings.filter(
        (booking) => booking.tableNumber === table.number,
      );

      let availableHoursForTable = availableHours;
      if (bookingsForTable.length > 0) {
        const bookedHourIds = new Set(
          bookingsForTable.map((booking) => booking.hour),
        );
        availableHoursForTable = availableHours.filter((availableHour) => {
          return !bookedHourIds.has(availableHour.id);
        });
      }

      return {
        ...table,
        availableHours: availableHoursForTable.map(
          (availableHour) => availableHour.id,
        ),
      };
    });

    return availableTables;
  }

  private async mapBookingsToTableNumbers(date: string) {
    const bookings = await this.bookingService.getBookingsByDate(date);
    return bookings.map((booking) => {
      return {
        hour: booking.availablehoursid,
        tableNumber: booking.tablenumber,
      };
    });
  }
}
