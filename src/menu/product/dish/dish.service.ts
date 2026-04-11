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
        throw new BadRequestException('Some ingredients are invalid');
      }
    }

    try {
      const dish = this.dishRepository.create({
        ...createDishDto,
        ingredients,
      });

      await this.dishRepository.save(dish);
    } catch (error) {
      this.handleDataBaseError(error);
    }
  }

  async getSingleDish(id: string) {
    const queryBuilder = this.dishRepository.createQueryBuilder();

    const dish = await queryBuilder
      .where({ id })
      .leftJoinAndSelect('Dish.ingredients', 'Ingredients')
      .leftJoinAndSelect('Ingredients.allergens', 'Allergens')
      .select()
      .getOne();

    if (!dish) {
      throw new BadRequestException('Dish not found');
    }

    let allergens = new Set();

    dish.ingredients.forEach((ingredient) => {
      ingredient.allergens.forEach((allergen) => {
        allergens.add({
          name: allergen.name,
          icon: allergen.icon,
        });
      });
    });

    return {
      ...dish,
      allergens: Array.from(allergens),
    };
  }

  async createIngredient(createIngredientDto: CreateIngredientDto) {
    let allergens: Allergen[] = [];

    if (createIngredientDto.allergens) {
      allergens = await this.allergenRepository.find({
        where: { name: In(createIngredientDto.allergens) },
      });

      if (allergens.length !== createIngredientDto.allergens.length) {
        throw new BadRequestException('Some allergens are invalid');
      }
    }

    try {
      const ingredient = this.ingredientRepository.create({
        ...createIngredientDto,
        allergens,
      });

      await this.ingredientRepository.save(ingredient);
    } catch (error) {
      this.handleDataBaseError(error);
    }
  }

  private handleDataBaseError(error) {
    if (error.code === DataBaseErrorCodes.DuplicatedKey) {
      throw new BadRequestException('Name is already in use');
    }
  }
}
