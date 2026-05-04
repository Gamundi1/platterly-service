import { User } from 'src/auth/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Booking } from './booking.entity';

@Entity()
export class BookingGuest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking, (booking) => booking.bookingGuests, {
    onDelete: 'CASCADE',
  })
  booking: Booking;

  @ManyToOne(() => User, (user) => user.bookingGuests, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ default: false })
  owner: boolean;
}
