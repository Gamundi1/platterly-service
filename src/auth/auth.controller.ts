import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@shared/guards/auth.guard';
import type { AuthenticatedRequest } from '@shared/types/authenticated-request.type';
import { AuthService } from './auth.service';
import { CreateUserDto } from './user/dto/create-user.dto';
import { GetUserDto } from './user/dto/get-user.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  async signIn(@Body() user: GetUserDto, @Res({ passthrough: true }) response) {
    const tokens = await this.authService.signIn(user);

    response.cookie('refresh-token', tokens['refresh-token'], {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      'access-token': tokens['access-token'],
    };
  }

  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Post('log-out')
  async logOut(@Res({ passthrough: true }) response) {
    response.clearCookie('refresh-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }

  @UseGuards(AuthGuard)
  @Get('user')
  getUser(@Req() request: AuthenticatedRequest) {
    const user = request.user;
    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      secondSurname: user.secondSurname,
      email: user.email,
      role: user.role,
    };
  }

  @Post('register')
  register(@Body() user: CreateUserDto) {
    return this.authService.register(user);
  }

  @Post('refresh')
  async refresh(@Req() request, @Res({ passthrough: true }) response) {
    const refreshToken = request.cookies['refresh-token'];

    const tokens = await this.authService.refreshTokens(refreshToken);

    response.cookie('refresh-token', tokens['refresh-token'], {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      'access-token': tokens['access-token'],
    };
  }
}
