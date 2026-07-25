import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query
} from '@nestjs/common';
import { CreateI18nDto } from './dto/create-i18n.dto';
import { I18nService } from './i18n.service';

@Controller('v1/translations')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Post('create')
  create(@Body() createI18nDto: CreateI18nDto) {
    return this.i18nService.create(createI18nDto);
  }

  @Get()
  findAllByLanguage(@Query('language') language: string) {
    return this.i18nService.findAll(language);
  }
}
