import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingModule } from 'src/booking/booking.module';
import { Table } from './entities/table.entity';
import { TableController } from './table.controller';
import { TableService } from './table.service';

@Module({
  controllers: [TableController],
  imports: [TypeOrmModule.forFeature([Table]), forwardRef(() => BookingModule)],
  providers: [TableService],
  exports: [TableService, TypeOrmModule],
})
export class TableModule {}
