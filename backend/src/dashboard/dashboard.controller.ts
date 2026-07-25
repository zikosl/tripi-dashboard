import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { CurrentUser, type AuthUser, JwtGuard } from '../common/auth.js';
import { DashboardService } from './dashboard.service.js';

class CreateOrganizerDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) slug!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() city?: string;
  @IsString() ownerFirstName!: string;
  @IsString() ownerLastName!: string;
  @IsEmail() ownerEmail!: string;
  @IsString() @MinLength(10) ownerPassword!: string;
}
class UpdateOrganizerDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) commissionRate?: number;
}
class CreateCatalogDto {
  @IsString() @MinLength(2) slug!: string;
  @IsString() @MinLength(1) nameAr!: string;
  @IsString() @MinLength(1) nameEn!: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() stateOrProvince?: string;
}
class UpdateCatalogDto {
  @IsOptional() @IsString() @MinLength(2) slug?: string;
  @IsOptional() @IsString() @MinLength(1) nameAr?: string;
  @IsOptional() @IsString() @MinLength(1) nameEn?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() stateOrProvince?: string;
  @IsOptional() @IsString() icon?: string;
}
class CreateTripDto {
  @IsString() titleAr!: string;
  @IsString() titleEn!: string;
  @IsString() descriptionAr!: string;
  @IsString() descriptionEn!: string;
  @IsString() slug!: string;
  @IsString() categoryId!: string;
  @IsString() destinationId!: string;
  @IsString() departureCity!: string;
  @IsString() startAt!: string;
  @IsString() endAt!: string;
  @IsString() bookingDeadline!: string;
  @IsNumber() @Min(0) pricePerPerson!: number;
  @IsNumber() @Min(1) totalSeats!: number;
  @IsOptional() @IsString() organizerId?: string;
}
class UpdateTripDto {
  @IsOptional() @IsString() titleAr?: string;
  @IsOptional() @IsString() titleEn?: string;
  @IsOptional() @IsString() descriptionAr?: string;
  @IsOptional() @IsString() descriptionEn?: string;
  @IsOptional() @IsString() departureCity?: string;
  @IsOptional() @IsString() startAt?: string;
  @IsOptional() @IsString() endAt?: string;
  @IsOptional() @IsString() bookingDeadline?: string;
  @IsOptional() @IsNumber() @Min(0) pricePerPerson?: number;
  @IsOptional() @IsNumber() @Min(1) totalSeats?: number;
}
class CreateManagedBookingDto {
  @IsEmail() customerEmail!: string;
  @IsString() tripId!: string;
  @IsNumber() @Min(1) seatCount!: number;
  @IsString() travelerFirstName!: string;
  @IsString() travelerLastName!: string;
  @IsEnum(['CASH', 'BANK_TRANSFER', 'PAYMENT_PROOF']) paymentMethod!:
    'CASH' | 'BANK_TRANSFER' | 'PAYMENT_PROOF';
}
class UpdateBookingDto {
  @IsOptional() @IsNumber() @Min(1) seatCount?: number;
  @IsOptional() @IsString() organizerNotes?: string;
  @IsOptional()
  @IsEnum([
    'PENDING_PAYMENT',
    'PAYMENT_REVIEW',
    'CONFIRMED',
    'CANCELLED_BY_ORGANIZER',
    'COMPLETED',
  ])
  status?:
    | 'PENDING_PAYMENT'
    | 'PAYMENT_REVIEW'
    | 'CONFIRMED'
    | 'CANCELLED_BY_ORGANIZER'
    | 'COMPLETED';
}
class CreateMemberDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(10) password!: string;
  @IsString() firstName!: string;
  @IsString() lastName!: string;
}
class StatusDto {
  @IsString() status!: string;
  @IsOptional() @IsString() reason?: string;
}
class CommissionDto {
  @IsNumber() @Min(0) @Max(100) commissionRate!: number;
}
class ComplaintDto {
  @IsString() @MinLength(2) subject!: string;
  @IsString() @MinLength(2) description!: string;
  @IsOptional() @IsString() organizerId?: string;
  @IsOptional() @IsString() bookingId?: string;
}

@Controller('dashboard')
@UseGuards(JwtGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get(':role/:section') section(
    @CurrentUser() user: AuthUser,
    @Param('role') role: string,
    @Param('section') section: string,
  ) {
    return this.dashboard.section(user, role, section);
  }
  @Post('admin/organizers') createOrganizer(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOrganizerDto,
  ) {
    return this.dashboard.createOrganizer(user, dto);
  }
  @Patch('organizers/:id') updateOrganizer(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizerDto,
  ) {
    return this.dashboard.updateOrganizer(user, id, dto);
  }
  @Post('admin/categories') createCategory(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCatalogDto,
  ) {
    return this.dashboard.createCategory(user, dto);
  }
  @Patch('categories/:id') updateCategory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogDto,
  ) {
    return this.dashboard.updateCategory(user, id, dto);
  }
  @Post('admin/destinations') createDestination(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCatalogDto,
  ) {
    return this.dashboard.createDestination(user, dto);
  }
  @Patch('destinations/:id') updateDestination(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogDto,
  ) {
    return this.dashboard.updateDestination(user, id, dto);
  }
  @Post('admin/complaints') createComplaint(
    @CurrentUser() user: AuthUser,
    @Body() dto: ComplaintDto,
  ) {
    return this.dashboard.createComplaint(user, dto);
  }
  @Post('organizer/trips') createTrip(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTripDto,
  ) {
    return this.dashboard.createTrip(user, dto);
  }
  @Post('admin/trips') createAdminTrip(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTripDto,
  ) {
    return this.dashboard.createTrip(user, dto);
  }
  @Patch('trips/:id') updateTrip(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.dashboard.updateTrip(user, id, dto);
  }
  @Post(':role/bookings') createBooking(
    @CurrentUser() user: AuthUser,
    @Param('role') role: string,
    @Body() dto: CreateManagedBookingDto,
  ) {
    return this.dashboard.createManagedBooking(user, role, dto);
  }
  @Patch('bookings/:id') updateBooking(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.dashboard.updateBooking(user, id, dto);
  }
  @Post('organizer/team') createMember(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMemberDto,
  ) {
    return this.dashboard.createMember(user, dto);
  }
  @Patch(':resource/:id/status') updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() dto: StatusDto,
  ) {
    return this.dashboard.updateStatus(user, resource, id, dto);
  }
  @Patch('admin/organizers/:id/commission') commission(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CommissionDto,
  ) {
    return this.dashboard.updateCommission(user, id, dto.commissionRate);
  }
}
