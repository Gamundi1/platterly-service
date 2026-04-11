import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
    default: 'USER',
    type: 'enum',
    enum: ['USER', 'CHEF', 'WAITER', 'ADMIN'],
  })
  role: string;
}
