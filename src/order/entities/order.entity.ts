import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderStatus } from '../enum/order-status.enum';
import { Booking } from 'src/booking/entities/booking.entity';
import { Product } from 'src/menu/product/entities/product.entity';
import { User } from 'src/auth/user/entities/user.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'timestamp',
  })
  scheduledAt: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.SCHEDULED,
  })
  orderStatus: OrderStatus;

  @ManyToOne(() => Booking, (booking) => booking.orders)
  booking: Booking;

  @ManyToMany(() => Product)
  @JoinTable()
  products: Product[];

  @ManyToOne(() => User, (user) => user.orders)
  user: User;
}
