import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@shared/guards/auth.guard';
import { CreateMenuDto } from './dto/create-menu.dto';
import { MenuService } from './menu.service';
import { DishService } from './product/dish/dish.service';
import { CreateDishDto } from './product/dish/dto/create-dish.dto';
import { CreateIngredientDto } from './product/dish/dto/create-ingredient.dto';
import { DrinkService } from './product/drink/drink.service';
import { CreateDrinkDto } from './product/drink/dto/create-drink.dto';
import type { AuthenticatedRequest } from '@shared/types/authenticated-request.type';
import { UserRole } from 'src/auth/user/enums/user-role.enum';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Controller('v1/menu')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly dishService: DishService,
    private readonly drinkService: DrinkService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  createNewMenu(
    @Req() request: AuthenticatedRequest,
    @Body() createMenuDto: CreateMenuDto,
  ) {
    if (request.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED_USER' });
    }

    return this.menuService.createMenu(createMenuDto);
  }

  @UseGuards(AuthGuard)
  @Put('modify')
  modifyMenu(
    @Req() request: AuthenticatedRequest,
    @Body() updateMenuDto: UpdateMenuDto,
  ) {
    if (request.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED_USER' });
    }

    return this.menuService.modifyMenu(updateMenuDto);
  }

  @UseGuards(AuthGuard)
  @Get('/all')
  findAllMenus(@Req() request: AuthenticatedRequest) {
    if (request.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED_USER' });
    }

    return this.menuService.findAllMenus();
  }

  @Get('available')
  findAllAvailableMenus() {
    return this.menuService.findAllAvailableMenus();
  }

  @Get('info/:id')
  getMenuById(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.getMenuById(id);
  }

  @UseGuards(AuthGuard)
  @Post('dish')
  createNewDish(
    @Body() dishDto: CreateDishDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED_USER' });
    }

    return this.dishService.createDish(dishDto);
  }

  @UseGuards(AuthGuard)
  @Get('dish')
  getAllDishes(@Req() request: AuthenticatedRequest) {
    if (request.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED_USER' });
    }
    return this.dishService.getAllDishes();
  }

  @UseGuards(AuthGuard)
  @Post('ingredient')
  createNewIngredient(
    @Body() ingredientDto: CreateIngredientDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED_USER' });
    }

    return this.dishService.createIngredient(ingredientDto);
  }

  @UseGuards(AuthGuard)
  @Post('drink')
  createNewDrink(
    @Body() drinkDto: CreateDrinkDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED_USER' });
    }

    return this.drinkService.createDrink(drinkDto);
  }
}
