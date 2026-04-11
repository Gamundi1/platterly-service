import { Booking } from 'src/booking/entities/booking.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class AvailableHours {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  interval: string;

  @OneToMany(() => Booking, (booking) => booking.availableHours)
  bookings: Booking[];
}
