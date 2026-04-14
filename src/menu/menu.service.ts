import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataBaseErrorCodes } from '@shared/interfaces/data-base-error-codes.interface';
import { In, Repository } from 'typeorm';
import { CreateMenuDto } from './dto/create-menu.dto';
import { Menu } from './entities/menu.entity';
import { Product } from './product/entities/product.entity';
import { Dish } from './product/dish/entities/dish.entity';
import { Drink } from './product/drink/entities/drink.entity';

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
        throw new BadRequestException('Some products are invalid');
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

  async getMenuById(id: string) {
    const queryBuilder = this.menuRepository.createQueryBuilder();

    const menu = await queryBuilder
      .where({ id })
      .leftJoinAndSelect('Menu.products', 'Products')
      .leftJoinAndSelect('Products.ingredients', 'Ingredients')
      .leftJoinAndSelect('Ingredients.allergens', 'Allergens')
      .getOne();

    if (!menu) {
      throw new BadRequestException('Menu not found');
    }

    const dishes: Array<any> = [];
    const drinks: Array<any> = [];

    menu.products.map((product) => {
      if (product instanceof Dish) {
        let allergens = new Set();
        product.ingredients.forEach((ingredient) => {
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
          price: product.priceUnits,
          priceUnits: product.priceUnits,
          cookTime: product.cookTime,
          images: product.images,
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
      throw new BadRequestException('Provide a valid list of products');
    }

    if (products.length !== uuids.length) {
      throw new BadRequestException('Some products are invalid');
    }

    return products;
  }

  private handleDataBaseError(error) {
    if (error.code === DataBaseErrorCodes.DuplicatedKey) {
      throw new BadRequestException('Name is already in use');
    }
  }
}
