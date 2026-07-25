import { CanActivate, createParamDecorator, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
export type AuthUser = { sub: string; role: string; organizerId?: string };
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<{ user: AuthUser }>().user);
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; user?: AuthUser }>();
    const token = request.headers.authorization?.replace(/^Bearer /, ''); if (!token) throw new UnauthorizedException();
    try { request.user = await this.jwt.verifyAsync<AuthUser>(token, { secret: process.env.JWT_ACCESS_SECRET }); return true; } catch { throw new UnauthorizedException(); }
  }
}
