import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './user/dto/create-user.dto';
import { GetUserDto } from './user/dto/get-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthGuard } from '@shared/guards/auth.guard';
import type { AuthenticatedRequest } from '@shared/types/authenticated-request.type';

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

  @Get('user')
  @UseGuards(AuthGuard)
  getUser(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  @Post('register')
  register(@Body() user: CreateUserDto) {
    return this.authService.register(user);
  }

  @Post('refresh')
  async refresh(
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) response,
  ) {
    const refreshToken = body.refreshToken;
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
