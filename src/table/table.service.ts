import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateTableDto } from './dto/create-table.dto';
import { Table } from './entities/table.entity';
import { Booking } from 'src/booking/entities/booking.entity';
import { BookingService } from 'src/booking/booking.service';
import { TableStatus } from './enum/table-status.enum';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,

    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
  ) {}

  async createTable(newTable: CreateTableDto) {
    try {
      const table = this.tableRepository.create(newTable);
      await this.tableRepository.save(table);
    } catch (error) {
      throw new BadRequestException({ code: 'TABLE_ALREADY_EXISTS'});
    }
  }

  async findOne(tableNumber: number) {
    try {
      const table = await this.tableRepository.findOne({
        where: { number: tableNumber },
      });

      if (!table) {
        throw new BadRequestException({ code: 'TABLE_NOT_FOUND' });
      }
      
      return table;
    } catch (error) {
      throw new BadRequestException({ code: 'FAILED_TO_RETRIEVE_TABLE' });
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

  async updateTableStatus(
    tableNumber: number,
    status: TableStatus,
    manager?: EntityManager,
  ) {
    const tableRepository = manager
      ? manager.getRepository(Table)
      : this.tableRepository;

    const table = await tableRepository.findOne({
      where: { number: tableNumber },
    });

    if (!table) {
      return;
    }

    if (
      table?.status === TableStatus.OCCUPIED &&
      status === TableStatus.OCCUPIED
    ) {
      throw new BadRequestException({ code: 'TABLE_ALREADY_OCCUPIED' });
    }

    table.status = status;
    return tableRepository.save(table);
  }

  private async mapBookingsToTableNumbers(date: string) {
    const bookings = await this.bookingService.getBookingsByDate(date);
    return bookings.map((booking) => {
      return {
        hour: booking.hour.id,
        tableNumber: booking.table.number,
      };
    });
  }
}
