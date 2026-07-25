import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
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

@Controller('v1/menu')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly dishService: DishService,
    private readonly drinkService: DrinkService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  createNewMenu(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.createMenu(createMenuDto);
  }

  @UseGuards(AuthGuard)
  @Get('/all')
  findAllMenus(@Req() request: AuthenticatedRequest) {
    return this.menuService.findAllMenus(request.user);
  }

  @Get('available')
  findAllAvailableMenus() {
    return this.menuService.findAllAvailableMenus();
  }

  @Get(':id')
  getMenuById(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.getMenuById(id);
  }

  @Post('dish')
  createNewDish(@Body() dishDto: CreateDishDto) {
    return this.dishService.createDish(dishDto);
  }

  @Get('dish/:id')
  getSingleDish(@Param('id', ParseUUIDPipe) id: string) {
    return this.dishService.getSingleDish(id);
  }

  @Post('ingredient')
  createNewIngredient(@Body() ingredientDto: CreateIngredientDto) {
    return this.dishService.createIngredient(ingredientDto);
  }

  @Post('drink')
  createNewDrink(@Body() drinkDto: CreateDrinkDto) {
    return this.drinkService.createDrink(drinkDto);
  }
}
