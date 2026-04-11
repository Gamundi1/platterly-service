import { Controller, Get, Param } from '@nestjs/common';
import { TableService } from './table.service';

@Controller('v1/table')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get('available/:date')
  findAllAvailableTables(@Param('date') date: string) {
    return this.tableService.findAllAvailableTablesByDate(date);
  }
}
