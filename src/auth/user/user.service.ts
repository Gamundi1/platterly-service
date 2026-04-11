import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { DataBaseErrorCodes } from '@shared/interfaces/data-base-error-codes.interface';
import { GetUserDto } from './dto/get-user.dto';

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
      throw new NotFoundException('User not found');
    }

    if (user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
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

  private handleDataBaseError(error) {
    if (error.code === DataBaseErrorCodes.DuplicatedKey) {
      throw new BadRequestException('email is already taken');
    }
  }
}
