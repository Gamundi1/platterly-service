import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AvailableHours } from '../availableHours/entities/available-hours.entity';
import { Table } from 'src/table/entities/table.entity';

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

  @ManyToOne(() => AvailableHours, (availableHours) => availableHours.bookings)
  availableHours: AvailableHours;

  @ManyToOne(() => Table, (table) => table.bookings)
  table: Table;
}
