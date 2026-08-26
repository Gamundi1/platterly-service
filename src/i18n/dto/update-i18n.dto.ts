import { PartialType } from '@nestjs/mapped-types';
import { CreateI18nDto } from './create-i18n.dto';

export class UpdateI18nDto extends PartialType(CreateI18nDto) {}
