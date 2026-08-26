import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './user/dto/create-user.dto';
import { JwtUser } from '@shared/interfaces/jwt-user.interface';
import { GetUserDto } from './user/dto/get-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(userInfo: GetUserDto): Promise<JwtUser> {
    const user = await this.userService.getUser(userInfo);
    return this.issueTokens(user.id, user.email);
  }

  async register(user: CreateUserDto): Promise<JwtUser | undefined> {
    const regEx = /^(?=.*\d)(?=.*[a-zA-Z]).{12}$/;

    if (!regEx.test(user.password)) {
      throw new UnauthorizedException({
        code: 'PASSWORD_NOT_SATISFY_CONSTRAINTS',
      });
    }

    let newUser;

    try {
      newUser = await this.userService.registerUser(user);
    } catch (error) {
      return;
    }
    return this.issueTokens(newUser.id, newUser.email);
  }

  async refreshTokens(refreshToken: string): Promise<JwtUser> {
    const payload = await this.verifyRefreshToken(refreshToken);

    if (payload.type !== 'refresh') {
      throw new BadRequestException({ code: 'INVALID_TOKEN_TYPE' });
    }

    const user = await this.userService.findUserById(payload.id);

    return this.issueTokens(user.id, user.email);
  }

  private async issueTokens(userId: string, email: string): Promise<JwtUser> {
    const accessToken = await this.jwtService.signAsync({
      id: userId,
      email,
      type: 'access',
    });
    const refreshToken = await this.jwtService.signAsync(
      { id: userId, type: 'refresh' },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    return {
      'access-token': accessToken,
      'refresh-token': refreshToken,
    };
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' });
    }
  }
}
