import { Module } from '@nestjs/common';
import { I18nService } from './i18n.service';
import { I18nController } from './i18n.controller';
import { I18n } from './entities/i18n.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [I18nController],
  imports: [TypeOrmModule.forFeature([I18n])],
  providers: [I18nService],
  exports: [TypeOrmModule],
})
export class I18nModule {}
