import { Table } from 'src/table/entities/table.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AvailableHours } from '../availableHours/entities/available-hours.entity';
import { Order } from 'src/order/entities/order.entity';
import { BookingStatus } from '../enum/booking-status.enum';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  guests: number;

  @Column({
    type: 'date',
  })
  date: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.CONFIRMED,
  })
  status: string;

  @ManyToOne(() => AvailableHours, (availableHours) => availableHours.bookings)
  availableHours: AvailableHours;

  @ManyToOne(() => Table, (table) => table.bookings)
  table: Table;

  @OneToMany(() => Order, (order) => order.booking)
  orders: Order[];
}
