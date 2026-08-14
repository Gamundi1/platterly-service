import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateDrinkDto } from './dto/create-drink.dto';
import { Drink } from './entities/drink.entity';
import { DataBaseErrorCodes } from '@shared/interfaces/data-base-error-codes.interface';
import { Allergen } from 'src/menu/allergen/entity/allergen.entity';

@Injectable()
export class DrinkService {
  constructor(
    @InjectRepository(Drink)
    private readonly drinkRepository: Repository<Drink>,

    @InjectRepository(Allergen)
    private readonly allergenRepository: Repository<Allergen>,
  ) {}

  async createDrink(createDrinkDto: CreateDrinkDto) {
    let allergens: Allergen[] = [];

    if (createDrinkDto.allergens) {
      allergens = await this.allergenRepository.find({
        where: { name: In(createDrinkDto.allergens) },
      });

      if (allergens.length !== createDrinkDto.allergens.length) {
        throw new BadRequestException({ code: 'SOME_ALLERGENS_ARE_INVALID' });
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

  private handleDataBaseError(error) {
    if (error.code === DataBaseErrorCodes.DuplicatedKey) {
      throw new BadRequestException({ code: 'DUPLICATED_KEY' });
    }
  }
}
