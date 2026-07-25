import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
@Controller('health') export class HealthController { constructor(private readonly db: PrismaService) {} @Get() async check() { await this.db.$queryRaw`SELECT 1`; return { status: 'ok', service: 'Tripi API' }; } }
