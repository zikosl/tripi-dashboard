import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { BookingsController } from './bookings/bookings.controller.js';
import { BookingsService } from './bookings/bookings.service.js';
import { CatalogController } from './catalog/catalog.controller.js';
import { HealthController } from './health/health.controller.js';
import { PrismaService } from './prisma/prisma.service.js';
import { LocalStorageService } from './uploads/local-storage.service.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), JwtModule.register({ global: true }), ScheduleModule.forRoot(), ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
  controllers: [AuthController, BookingsController, CatalogController, HealthController],
  providers: [PrismaService, AuthService, BookingsService, LocalStorageService],
})
export class AppModule {}
