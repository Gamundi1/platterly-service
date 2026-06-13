import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderStatus } from '../enum/order-status.enum';
import { Booking } from 'src/booking/entities/booking.entity';
import { User } from 'src/auth/user/entities/user.entity';
import { OrderProduct } from './order-product.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'timestamp',
  })
  scheduledAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  deliveredAt: Date;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.SCHEDULED,
  })
  orderStatus: OrderStatus;

  @ManyToOne(() => Booking, (booking) => booking.orders)
  booking: Booking;

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order, {
    cascade: true,
  })
  orderProducts: OrderProduct[];

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @BeforeInsert()
  setScheduledAt() {
    if (!this.scheduledAt) {
      this.scheduledAt = new Date();
    }
  }
}
