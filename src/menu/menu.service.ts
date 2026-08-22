import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataBaseErrorCodes } from '@shared/interfaces/data-base-error-codes.interface';
import { In, Repository } from 'typeorm';
import { CreateMenuDto } from './dto/create-menu.dto';
import { Menu } from './entities/menu.entity';
import { Dish } from './product/dish/entities/dish.entity';
import { Drink } from './product/drink/entities/drink.entity';
import { Product } from './product/entities/product.entity';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createMenu(createMenuDto: CreateMenuDto) {
    let products: Product[] = [];

    if (createMenuDto.products) {
      products = await this.productRepository.find({
        where: { id: In(createMenuDto.products) },
      });

      if (products.length !== createMenuDto.products.length) {
        throw new BadRequestException({ code: 'SOME_PRODUCTS_ARE_INVALID' });
      }
    }

    try {
      const menu = this.menuRepository.create({
        ...createMenuDto,
        products,
      });

      await this.menuRepository.save(menu);
    } catch (error) {
      this.handleDataBaseError(error);
    }
  }

  async findAllMenus(): Promise<Menu[]> {
    return this.menuRepository.find();
  }

  async findAllAvailableMenus() {
    const queryBuilder = this.menuRepository.createQueryBuilder();

    const availableMenus = await queryBuilder
      .where(
        'Menu.availableFrom <= :currentDate and Menu.availableTo >= :currentDate',
        {
          currentDate: new Date(),
        },
      )
      .select(['Menu.id', 'Menu.name'])
      .getMany();

    return availableMenus;
  }

  async modifyMenu(updateMenuDto: UpdateMenuDto) {
    const menu = await this.menuRepository.findOne({
      where: { id: updateMenuDto.id },
      relations: {
        products: true,
      },
    });

    if (!menu) {
      throw new NotFoundException({ code: 'MENU_NOT_FOUND' });
    }

    const products = await this.productRepository.find({
      where: {
        id: In(updateMenuDto.products),
      },
    });

    if (products.length !== updateMenuDto.products.length) {
      throw new BadRequestException({ code: 'SOME_PRODUCTS_ARE_INVALID' });
    }

    menu.availableFrom = updateMenuDto.availableFrom;
    menu.availableTo = updateMenuDto.availableTo;
    menu.products = products;

    return this.menuRepository.save(menu);
  }

  async getMenuById(id: string) {
    const queryBuilder = this.menuRepository.createQueryBuilder();

    const menu = await queryBuilder
      .where({ id })
      .leftJoinAndSelect('Menu.products', 'Products')
      .leftJoinAndSelect('Products.ingredients', 'Ingredients')
      .leftJoinAndSelect('Ingredients.allergens', 'Allergens')
      .getOne();

    if (!menu) {
      throw new NotFoundException({ code: 'MENU_NOT_FOUND' });
    }

    const dishes: Array<any> = [];
    const drinks: Array<any> = [];

    menu.products.map((product) => {
      if (product instanceof Dish) {
        let ingredients = new Set();
        let allergens = new Set();
        product.ingredients.forEach((ingredient) => {
          ingredients.add(ingredient.name);
          ingredient.allergens.forEach((allergen) => {
            allergens.add({
              name: allergen.name,
              icon: allergen.icon,
            });
          });
        });

        dishes.push({
          id: product.id,
          name: product.name,
          price: product.price,
          priceUnits: product.priceUnits,
          cookTime: product.cookTime,
          images: product.images,
          ingredients: Array.from(ingredients),
          allergens: Array.from(allergens),
        });
      }

      if (product instanceof Drink) {
        drinks.push(product);
      }
    });

    return {
      id: menu.id,
      name: menu.name,
      products: {
        dishes,
        drinks,
      },
    };
  }

  async getAllProductsFromId(uuids: string[]) {
    const products = await this.productRepository.find({
      where: { id: In(uuids) },
    });

    if (!products) {
      throw new BadRequestException({ code: 'NON_PROVIDED_PRODUCTS' });
    }

    if (products.length !== uuids.length) {
      throw new NotFoundException({ code: 'SOME_PRODUCTS_NOT_FOUND' });
    }

    return products;
  }

  private handleDataBaseError(error) {
    if (error.code === DataBaseErrorCodes.DuplicatedKey) {
      throw new BadRequestException({ code: 'NAME_ALREADY_IN_USE' });
    }
  }
}
