import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsEnum, IsInt, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentUser, type AuthUser, JwtGuard } from '../common/auth.js';
import { BookingsService } from './bookings.service.js';
class TravelerDto { @IsString() firstName!: string; @IsString() lastName!: string; }
class CreateBookingDto { @IsUUID() tripId!: string; @IsInt() @Min(1) @Max(20) seatCount!: number; @IsEnum(['CASH', 'BANK_TRANSFER', 'PAYMENT_PROOF']) paymentMethod!: 'CASH'|'BANK_TRANSFER'|'PAYMENT_PROOF'; @IsArray() @ValidateNested({ each: true }) @Type(() => TravelerDto) travelers!: TravelerDto[]; }
@Controller('customer/bookings') @UseGuards(JwtGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}
  @Post() create(@CurrentUser() user: AuthUser, @Headers('idempotency-key') key: string | undefined, @Body() dto: CreateBookingDto) { return this.bookings.create(user.sub, key, dto); }
  @Get() list(@CurrentUser() user: AuthUser) { return this.bookings.list(user.sub); }
  @Get(':id') get(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.bookings.get(user.sub, id); }
  @Post(':id/cancel') cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.bookings.cancel(user.sub, id); }
}
