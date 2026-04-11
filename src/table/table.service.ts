import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BookingService } from 'src/booking/booking.service';
import { Repository, Table } from 'typeorm';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    private readonly bookingService: BookingService,
  ) {}

  findAllAvailableTablesByDate(date: string) {
    const queryBuilder = this.tableRepository.createQueryBuilder();
  }
}
