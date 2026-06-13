import { User } from 'src/auth/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  endpoint: string;

  @Column({
    type: 'jsonb',
  })
  subscription: any;

  @ManyToOne(() => User, (user) => user.notifications)
  user: User;
}
