import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService } from 'src/booking/booking.service';
import { Table } from './entities/table.entity';
import { TableController } from './table.controller';
import { TableService } from './table.service';

@Module({
  controllers: [TableController],
  imports: [TypeOrmModule.forFeature([Table])],
  providers: [TableService, BookingService],
})
export class TableModule {}
