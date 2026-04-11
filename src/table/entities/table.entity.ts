import { Booking } from 'src/booking/entities/booking.entity';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity()
export class Table {
  @PrimaryColumn({
    type: 'int',
  })
  number: number;

  @Column({
    type: 'int',
  })
  capacity: number;

  @Column({
    type: 'int',
  })
  inlinePosition: number;

  @Column({
    type: 'int',
  })
  blockPosition: number;

  @OneToMany(() => Booking, (booking) => booking.table)
  bookings: Booking[];
}
