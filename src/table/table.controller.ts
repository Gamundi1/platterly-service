import { Body, Controller, Get, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { AuthGuard } from '@shared/guards/auth.guard';
import type { AuthenticatedRequest } from '@shared/types/authenticated-request.type';
import { UserRole } from 'src/auth/user/enums/user-role.enum';

@Controller('v1/table')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @UseGuards(AuthGuard)
  @Post()
  createTable(@Body() createTableDto: CreateTableDto, @Req() request: AuthenticatedRequest) {
    if (request.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED_USER' });
    }
    return this.tableService.createTable(createTableDto);
  }

  @Get('available/:date')
  findAllAvailableTables(@Param('date') date: string) {
    return this.tableService.findAllAvailableTablesByDate(date);
  }
}
