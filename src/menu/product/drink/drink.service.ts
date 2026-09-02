import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataBaseErrorCodes } from '@shared/interfaces/data-base-error-codes.interface';
import { AllergenService } from 'src/menu/allergen/allergen.service';
import { Allergen } from 'src/menu/allergen/entity/allergen.entity';
import { Repository } from 'typeorm';
import { CreateDrinkDto } from './dto/create-drink.dto';
import { Drink } from './entities/drink.entity';

@Injectable()
export class DrinkService {
  constructor(
    @InjectRepository(Drink)
    private readonly drinkRepository: Repository<Drink>,
    private readonly allergenService: AllergenService,
  ) {}

  async createDrink(createDrinkDto: CreateDrinkDto) {
    let allergens: Allergen[] = [];

    if (createDrinkDto.allergens) {
      allergens = await this.allergenService.getAllergenByName(
        createDrinkDto.allergens,
      );

      if (allergens.length !== createDrinkDto.allergens.length) {
        throw new BadRequestException({
          code: 'SOME_ALLERGENS_ARE_INVALID',
          label: 'some_allergens_are_invalid_error_title',
          message: 'some_allergens_are_invalid_error_message',
        });
      }
    }

    try {
      const drink = this.drinkRepository.create({
        ...createDrinkDto,
        allergens,
      });

      await this.drinkRepository.save(drink);
    } catch (error) {
      this.handleDataBaseError(error);
    }
  }

  getAllDrinks() {
    return this.drinkRepository.find();
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
