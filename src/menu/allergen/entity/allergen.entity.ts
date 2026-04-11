import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Allergen {
  @PrimaryColumn()
  name: string;

  @Column()
  description: string;

  @Column({
    default: ''
  })
  icon: string;
}
