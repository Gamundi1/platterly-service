import { Allergen } from 'src/menu/allergen/entity/allergen.entity';
import {
  BeforeInsert,
  ChildEntity,
  Column,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { Product } from '../../entities/product.entity';

@ChildEntity()
export class Drink extends Product {
  @Column({ type: 'numeric' })
  volume: number;

  @Column()
  units: string;

  @Column()
  isAlcoholic: boolean;

  @ManyToMany(() => Allergen)
  @JoinTable()
  allergens: Allergen[];

  @BeforeInsert()
  checkNameFormat() {
    this.name = this.name.split(' ').join('-').toLowerCase();

    const nameSplitted = this.name.split('_');

    if (nameSplitted[nameSplitted.length - 1] !== 'drink') {
      this.name = `${this.name}_drink`;
    }
  }
}
