import { Allergen } from 'src/menu/allergen/entity/allergen.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  name: string;

  @Column()
  description: string;

  @ManyToMany(() => Allergen)
  @JoinTable()
  allergens: Allergen[];

  @BeforeInsert()
  checkNameFormat() {
    this.name = this.name.split(' ').join('-').toLowerCase();

    const nameSplitted = this.name.split('_');

    if (nameSplitted[nameSplitted.length - 1] !== 'ingredient') {
      this.name = `${this.name}_ingredient`;
    }
  }
}
