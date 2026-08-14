import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDishDto } from './dto/create-dish.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { DataBaseErrorCodes } from '@shared/interfaces/data-base-error-codes.interface';
import { Dish } from './entities/dish.entity';
import { Allergen } from 'src/menu/allergen/entity/allergen.entity';

@Injectable()
export class DishService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,

    @InjectRepository(Allergen)
    private readonly allergenRepository: Repository<Allergen>,

    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
  ) {}

  async createDish(createDishDto: CreateDishDto) {
    let ingredients: Ingredient[] = [];

    if (createDishDto.ingredients) {
      ingredients = await this.ingredientRepository.find({
        where: { id: In(createDishDto.ingredients) },
      });

      if (ingredients.length !== createDishDto.ingredients.length) {
        throw new BadRequestException({ code: 'SOME_INGREDIENTS_ARE_INVALID' });
      }
    }
    try {
      const dish = this.dishRepository.create({
        ...createDishDto,
        ingredients,
      });

      const createdDish = await this.dishRepository.save(dish);
      return {
        id: createdDish.id,
      };
    } catch (error) {
      this.handleDataBaseError(error);
    }
  }

  async createIngredient(createIngredientDto: CreateIngredientDto) {
    let allergens: Allergen[] = [];

    if (createIngredientDto.allergens) {
      allergens = await this.allergenRepository.find({
        where: { name: In(createIngredientDto.allergens) },
      });

      if (allergens.length !== createIngredientDto.allergens.length) {
        throw new BadRequestException({ code: 'SOME_ALLERGENS_ARE_INVALID' });
      }
    }

    try {
      const ingredient = this.ingredientRepository.create({
        ...createIngredientDto,
        allergens,
      });

      const createdIngredient = await this.ingredientRepository.save(ingredient);
      return {
        id: createdIngredient.id
      }
    } catch (error) {
      this.handleDataBaseError(error);
    }
  }

  private handleDataBaseError(error) {
    if (error.code === DataBaseErrorCodes.DuplicatedKey) {
      throw new BadRequestException({ code: 'DUPLICATED_KEY' });
    }
  }
}
