import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsPhoneNumber, IsString, MaxLength, MinLength } from 'class-validator';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { CurrentUser, type AuthUser, JwtGuard } from '../common/auth.js';
class RegisterDto { @IsString() @MaxLength(80) firstName!: string; @IsString() @MaxLength(80) lastName!: string; @IsEmail() email!: string; @IsPhoneNumber() phone!: string; @IsString() @MinLength(10) password!: string; }
class LoginDto { @IsEmail() email!: string; @IsString() password!: string; }
class RefreshDto { @IsString() refreshToken!: string; }
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') register(@Body() dto: RegisterDto, @Req() req: Request) { return this.auth.register(dto, req); }
  @Post('login') login(@Body() dto: LoginDto, @Req() req: Request) { return this.auth.login(dto, req); }
  @Post('refresh') refresh(@Body() dto: RefreshDto, @Req() req: Request) { return this.auth.refresh(dto.refreshToken, req); }
  @Post('logout') logout(@Body() dto: RefreshDto) { return this.auth.logout(dto.refreshToken); }
  @Get('me') @UseGuards(JwtGuard) me(@CurrentUser() user: AuthUser, @Headers('accept-language') locale?: string) { return this.auth.me(user.sub, locale); }
}
