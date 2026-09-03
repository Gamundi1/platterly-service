import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataBaseErrorCodes } from '@shared/interfaces/data-base-error-codes.interface';
import { AllergenService } from 'src/menu/allergen/allergen.service';
import { Allergen } from 'src/menu/allergen/entity/allergen.entity';
import { In, Repository } from 'typeorm';
import { CreateDishDto } from './dto/create-dish.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { Dish } from './entities/dish.entity';
import { Ingredient } from './entities/ingredient.entity';

@Injectable()
export class DishService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,

    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    private readonly allergenService: AllergenService,
  ) {}

  async getAllDishes() {
    let dishes = await this.dishRepository.find({
      relations: {
        ingredients: true,
      },
    });

    dishes.map((dish) => {
      let ingredients = dish.ingredients.map((ingredient) => {
        return ingredient.name;
      });
      dish.ingredients = ingredients as any;
    });
    return dishes;
  }

  async getAllIngredients() {
    let ingredients = await this.ingredientRepository.find();
    return ingredients;
  }

  async createDish(createDishDto: CreateDishDto) {
    let ingredients: Ingredient[] = [];

    if (createDishDto.ingredients) {
      ingredients = await this.ingredientRepository.find({
        where: { id: In(createDishDto.ingredients) },
      });

      if (ingredients.length !== createDishDto.ingredients.length) {
        throw new BadRequestException({
          code: 'SOME_INGREDIENTS_ARE_INVALID',
          label: 'some_ingredients_are_invalid_error_title',
          message: 'some_ingredients_are_invalid_error_message',
        });
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
      allergens = await this.allergenService.getAllergenByName(
        createIngredientDto.allergens,
      );

      if (allergens.length !== createIngredientDto.allergens.length) {
        throw new BadRequestException({
          code: 'SOME_ALLERGENS_ARE_INVALID',
          label: 'some_allergens_are_invalid_error_title',
          message: 'some_allergens_are_invalid_error_message',
        });
      }
    }

    try {
      const ingredient = this.ingredientRepository.create({
        ...createIngredientDto,
        allergens,
      });

      const createdIngredient =
        await this.ingredientRepository.save(ingredient);
      return {
        id: createdIngredient.id,
      };
    } catch (error) {
      this.handleDataBaseError(error);
    }
  }

  private handleDataBaseError(error) {
    if (error.code === DataBaseErrorCodes.DuplicatedKey) {
      throw new BadRequestException({
        code: 'DUPLICATED_KEY',
        label: 'duplicated_key_error_title',
        message: 'duplicated_key_error_message',
      });
    }
  }
}
