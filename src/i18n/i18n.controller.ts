import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { CreateI18nDto } from './dto/create-i18n.dto';
import { I18nService } from './i18n.service';
import { AuthGuard } from '@shared/guards/auth.guard';
import type { AuthenticatedRequest } from '@shared/types/authenticated-request.type';
import { UserRole } from 'src/auth/user/enums/user-role.enum';

@Controller('v1/translations')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @UseGuards(AuthGuard)
  @Post('create')
  create(@Body() createI18nDto: CreateI18nDto, @Req() request: AuthenticatedRequest) {
    if (request.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED_USER' });
    }

    return this.i18nService.create(createI18nDto);
  }

  @Get()
  findAllByLanguage(@Query('language') language: string) {
    return this.i18nService.findAll(language);
  }
}
