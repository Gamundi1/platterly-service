import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/auth/user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({ code: 'TOKEN_NOT_PROVIDED' });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      const user = await this.userService.findUserById(payload.id);

      if (!user) {
        throw new UnauthorizedException({ code: 'USER_NOT_FOUND' });
      }

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN' });
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
