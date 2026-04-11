import { Injectable } from '@nestjs/common';
import { UserService } from './user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './user/dto/create-user.dto';
import { JwtUser } from '@shared/interfaces/jwt-user.interface';
import { GetUserDto } from './user/dto/get-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(userInfo: GetUserDto): Promise<JwtUser> {
    const user = await this.userService.getUser(userInfo);

    const jwtPayload = await this.jwtService.signAsync({
      email: user.email,
      name: user.name,
      surname: user.surname,
      secondSurname: user.secondSurname,
    });

    return {
      'access-token': jwtPayload,
    };
  }

  async register(user: CreateUserDto): Promise<JwtUser> {
    const newUser = await this.userService.registerUser(user);
    const jwtPayload = await this.jwtService.signAsync({
      email: newUser.email,
      name: newUser.name,
      surname: newUser.surname,
      secondSurname: newUser.secondSurname,
    });

    return {
      'access-token': jwtPayload,
    };
  }
}
