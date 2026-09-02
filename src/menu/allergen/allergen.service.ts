import { InjectRepository } from '@nestjs/typeorm';
import { FindOperator, In, Repository } from 'typeorm';
import { Allergen } from './entity/allergen.entity';

export class AllergenService {
  constructor(
    @InjectRepository(Allergen)
    private readonly allergenRepository: Repository<Allergen>,
  ) {}

  public getAllAllergens() {
    return this.allergenRepository.find();
  }

  public getAllergenByName(name: string[]) {
    return this.allergenRepository.find({
      where: {
        name: In(name),
      },
    });
  }
}
