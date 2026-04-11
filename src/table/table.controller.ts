import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';

@Controller('v1/table')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  createTable(@Body() createTableDto: CreateTableDto) {
    return this.tableService.createTable(createTableDto);
  }

  @Get('available/:date')
  findAllAvailableTables(@Param('date') date: string) {
    return this.tableService.findAllAvailableTablesByDate(date);
  }
}
