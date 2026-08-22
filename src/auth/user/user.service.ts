import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataBaseErrorCodes } from '@shared/interfaces/data-base-error-codes.interface';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUser(userInfo: GetUserDto): Promise<User> {
    const { email, password } = userInfo;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    if (user.password !== password) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    return user;
  }

  async registerUser(user: CreateUserDto): Promise<User> {
    let newUser: User;

    try {
      newUser = this.userRepository.create(user);
      await this.userRepository.save(newUser);
    } catch (error) {
      this.handleDataBaseError(error);
    }

    return newUser!;
  }

  async findUserById(uuid: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: uuid } });

    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    }

    return user;
  }

  async findUserByRole(role: UserRole): Promise<User[]> {
    const users = await this.userRepository.find({ where: { role } });

    if (!users || users.length === 0) {
      throw new NotFoundException({ code: 'USERS_NOT_FOUND' });
    }

    return users;
  }

  private handleDataBaseError(error) {
    if (error.code === DataBaseErrorCodes.DuplicatedKey) {
      throw new BadRequestException({ code: 'ERROR_CREATING_NEW_USER' });
    }
  }
}
