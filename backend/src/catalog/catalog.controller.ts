import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
@Controller('public')
export class CatalogController {
  constructor(private readonly db: PrismaService) {}
  @Get('trips') async trips(@Headers('accept-language') language = 'en', @Query('page') page = '1', @Query('pageSize') size = '20', @Query('search') search?: string) {
    const locale = language.toLowerCase().startsWith('ar') ? 'AR' : 'EN'; const pageSize = Math.min(Math.max(Number(size) || 20, 1), 50); const skip = (Math.max(Number(page) || 1, 1) - 1) * pageSize;
    const where: Prisma.TripWhereInput = { status: { in: ['PUBLISHED', 'FULL'] }, visibility: 'PUBLIC', organizer: { status: 'APPROVED' }, ...(search ? { translations: { some: { normalizedTitle: { contains: normalizeSearch(search), mode: 'insensitive' } } } } : {}) };
    const [items, total] = await this.db.$transaction([this.db.trip.findMany({ where, skip, take: pageSize, orderBy: { startAt: 'asc' }, include: { translations: { where: { locale } }, images: { orderBy: { sortOrder: 'asc' }, take: 1 }, organizer: { select: { name: true, slug: true } }, destination: { include: { translations: { where: { locale } } } } } }), this.db.trip.count({ where })]);
    return { items, localeUsed: locale, pagination: { page: Math.floor(skip / pageSize) + 1, pageSize, total } };
  }
  @Get('trips/:slug') trip(@Param('slug') slug: string, @Headers('accept-language') language = 'en') { const locale = language.toLowerCase().startsWith('ar') ? 'AR' : 'EN'; return this.db.trip.findFirstOrThrow({ where: { slug, status: { in: ['PUBLISHED', 'FULL'] }, organizer: { status: 'APPROVED' } }, include: { translations: { where: { locale } }, images: { orderBy: { sortOrder: 'asc' } }, organizer: { select: { name: true, slug: true, logoUrl: true } }, destination: { include: { translations: { where: { locale } } } }, category: { include: { translations: { where: { locale } } } } } }); }
  @Get('destinations') destinations() { return this.db.destination.findMany({ where: { isActive: true }, include: { translations: true } }); }
  @Get('categories') categories() { return this.db.tripCategory.findMany({ where: { isActive: true }, include: { translations: true } }); }
}
function normalizeSearch(value: string) { return value.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim().toLowerCase(); }
