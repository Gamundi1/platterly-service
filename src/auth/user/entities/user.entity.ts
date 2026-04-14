import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { Order } from 'src/order/entities/order.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column({ nullable: true })
  secondSurname?: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    default: UserRole.USER,
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
