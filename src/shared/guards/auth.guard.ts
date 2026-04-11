import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    console.log(request.headers['authorization']);
    return undefined;
  }
}
