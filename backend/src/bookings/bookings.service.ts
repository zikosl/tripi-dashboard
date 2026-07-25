import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { Cron } from '@nestjs/schedule';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
@Injectable()
export class BookingsService {
  constructor(private readonly db: PrismaService) {}
  async create(customerId: string, idempotencyKey: string | undefined, input: { tripId: string; seatCount: number; paymentMethod: 'CASH'|'BANK_TRANSFER'|'PAYMENT_PROOF'; travelers: { firstName: string; lastName: string }[] }) {
    if (!idempotencyKey || idempotencyKey.length > 100) throw new BadRequestException('A valid Idempotency-Key header is required.');
    if (input.travelers.length !== input.seatCount) throw new BadRequestException('Traveler count must match seat count.');
    const existing = await this.db.booking.findUnique({ where: { customerId_idempotencyKey: { customerId, idempotencyKey } }, include: { travelers: true, payments: true } }); if (existing) return existing;
    return this.db.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: input.tripId }, include: { organizer: true } });
      if (!trip || trip.organizer.status !== 'APPROVED' || !['PUBLISHED', 'FULL'].includes(trip.status) || trip.startAt <= new Date() || trip.bookingDeadline <= new Date()) throw new BadRequestException('This trip is not available for booking.');
      const changed = await tx.$executeRaw`UPDATE "Trip" SET "reservedSeats" = "reservedSeats" + ${input.seatCount}, "status" = CASE WHEN "reservedSeats" + ${input.seatCount} = "totalSeats" THEN 'FULL'::"TripStatus" ELSE "status" END WHERE "id" = ${input.tripId} AND "status" IN ('PUBLISHED','FULL') AND "reservedSeats" + ${input.seatCount} <= "totalSeats"`;
      if (changed !== 1) throw new ConflictException('There are not enough seats available.');
      const unitPrice = trip.pricePerPerson; const subtotal = unitPrice.mul(input.seatCount); const serviceFee = new Prisma.Decimal(0); const totalAmount = subtotal.add(serviceFee);
      return tx.booking.create({ data: { bookingReference: reference(), customerId, tripId: trip.id, organizerId: trip.organizerId, seatCount: input.seatCount, unitPrice, subtotal, serviceFee, discountAmount: 0, totalAmount, currency: trip.currency, status: input.paymentMethod === 'CASH' ? 'CONFIRMED' : 'PENDING_PAYMENT', paymentStatus: input.paymentMethod === 'CASH' ? 'UNPAID' : 'UNPAID', expiresAt: input.paymentMethod === 'CASH' ? null : new Date(Date.now() + 30 * 60_000), idempotencyKey, travelers: { create: input.travelers.map((traveler, index) => ({ ...traveler, isPrimary: index === 0 })) }, payments: { create: { amount: totalAmount, currency: trip.currency, method: input.paymentMethod, status: 'UNPAID' } }, history: { create: { newStatus: input.paymentMethod === 'CASH' ? 'CONFIRMED' : 'PENDING_PAYMENT', actorUserId: customerId } } }, include: { travelers: true, payments: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
  list(customerId: string) { return this.db.booking.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' }, include: { trip: { include: { translations: true, images: { take: 1 } } }, payments: true } }); }
  async get(customerId: string, id: string) { const booking = await this.db.booking.findFirst({ where: { id, customerId }, include: { trip: { include: { translations: true, images: true } }, travelers: true, payments: true, history: { orderBy: { createdAt: 'asc' } } } }); if (!booking) throw new NotFoundException(); return booking; }
  async cancel(customerId: string, id: string) { return this.db.$transaction(async (tx) => { const booking = await tx.booking.findFirst({ where: { id, customerId } }); if (!booking || !['PENDING_PAYMENT','PAYMENT_REVIEW','CONFIRMED'].includes(booking.status)) throw new BadRequestException('Booking cannot be cancelled.'); await tx.booking.update({ where: { id }, data: { status: 'CANCELLED_BY_CUSTOMER', cancelledAt: new Date(), history: { create: { previousStatus: booking.status, newStatus: 'CANCELLED_BY_CUSTOMER', actorUserId: customerId } } } }); await tx.trip.update({ where: { id: booking.tripId }, data: { reservedSeats: { decrement: booking.seatCount } } }); await tx.trip.updateMany({ where: { id: booking.tripId, status: 'FULL', startAt: { gt: new Date() } }, data: { status: 'PUBLISHED' } }); return { cancelled: true }; }); }
  @Cron('*/5 * * * *') async expire() { const expired = await this.db.booking.findMany({ where: { status: 'PENDING_PAYMENT', expiresAt: { lte: new Date() } }, select: { id: true, tripId: true, seatCount: true } }); for (const item of expired) await this.expireOne(item.id); }
  private async expireOne(id: string) { await this.db.$transaction(async (tx) => { const changed = await tx.booking.updateMany({ where: { id, status: 'PENDING_PAYMENT', expiresAt: { lte: new Date() } }, data: { status: BookingStatus.EXPIRED } }); if (changed.count !== 1) return; const booking = await tx.booking.findUniqueOrThrow({ where: { id } }); await tx.trip.update({ where: { id: booking.tripId }, data: { reservedSeats: { decrement: booking.seatCount }, status: 'PUBLISHED' } }); await tx.bookingStatusHistory.create({ data: { bookingId: id, previousStatus: 'PENDING_PAYMENT', newStatus: 'EXPIRED' } }); }); }
}
function reference() { return `TRP-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').slice(0, 6).toUpperCase()}`; }
