import {
  BeforeInsert,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../product/entities/product.entity';

@Entity()
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  name: string;

  @Column({ type: 'timestamptz' })
  availableFrom: Date;

  @Column({ type: 'timestamptz' })
  availableTo: Date;

  @ManyToMany(() => Product)
  @JoinTable()
  products: Product[];

  @BeforeInsert()
  checkNameFormat() {
    this.name = this.name.split(' ').join('-').toLowerCase();

    const nameSplitted = this.name.split('_');

    if (nameSplitted[nameSplitted.length - 1] !== 'menu') {
      this.name = `${this.name}_menu`;
    }
  }
}
