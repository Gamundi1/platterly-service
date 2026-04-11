import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from './entities/menu.entity';
import { Allergen } from './allergen/entity/allergen.entity';
import { DishService } from './product/dish/dish.service';
import { Dish } from './product/dish/entities/dish.entity';
import { Ingredient } from './product/dish/entities/ingredient.entity';
import { DrinkService } from './product/drink/drink.service';
import { Drink } from './product/drink/entities/drink.entity';
import { Product } from './product/entities/product.entity';

@Module({
  controllers: [MenuController],
  imports: [
    TypeOrmModule.forFeature([
      Menu,
      Allergen,
      Ingredient,
      Dish,
      Drink,
      Product,
    ]),
  ],
  providers: [MenuService, DishService, DrinkService],
})
export class MenuModule {}
