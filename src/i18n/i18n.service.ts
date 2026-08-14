import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateI18nDto } from './dto/create-i18n.dto';
import { I18n } from './entities/i18n.entity';

@Injectable()
export class I18nService {
  constructor(
    @InjectRepository(I18n)
    private readonly i18nRepository: Repository<I18n>,
  ) {}

  create(createI18nDto: CreateI18nDto) {

    try {
      const translation = this.i18nRepository.create(createI18nDto);

      this.i18nRepository.save(createI18nDto)
    } catch (error) {
      throw new BadRequestException({ code: 'DUPLICATED_KEY' });
    }
  }

  async findAll(language: string) {
    if (!language) {
      throw new BadRequestException({ code: 'LANGUAGE_REQUIRED' });
    }

    const translations = await this.i18nRepository
      .createQueryBuilder()
      .select(`key, ${language} as value`)
      .getRawMany();

    const mappedTranslations: Record<string, string> = {};

    translations.map((translation) => {
      mappedTranslations[translation.key] = translation.value;
    });
    return mappedTranslations;
  }
}
