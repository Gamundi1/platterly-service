import {
  BeforeInsert,
  ChildEntity,
  Column,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { Product } from '../../entities/product.entity';
import { Ingredient } from './ingredient.entity';

@ChildEntity()
export class Dish extends Product {
  @Column({ type: 'numeric' })
  cookTime: number;

  @Column({ type: 'text', array: true, default: [] })
  images: string[];

  @ManyToMany(() => Ingredient)
  @JoinTable({
    name: 'dish_ingredients',
  })
  ingredients: Ingredient[];

  @BeforeInsert()
  checkNameFormat() {
    this.name = this.name.split(' ').join('-').toLowerCase();

    const nameSplitted = this.name.split('_');

    if (nameSplitted[nameSplitted.length - 1] !== 'dish') {
      this.name = `${this.name}_dish`;
    }
  }
}
