import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, ComplaintStatus, OrganizerStatus, PaymentStatus, TripStatus, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import type { AuthUser } from '../common/auth.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly db: PrismaService) {}

  async section(user: AuthUser, role: string, section: string) {
    if (role === 'admin') {
      this.admin(user);
      return this.adminSection(section);
    }
    if (role === 'organizer') {
      const organizerId = await this.organizer(user);
      return this.organizerSection(organizerId, section);
    }
    throw new NotFoundException('Dashboard section not found.');
  }

  async createOrganizer(user: AuthUser, input: { name: string; slug: string; email: string; city?: string; ownerFirstName:string; ownerLastName:string; ownerEmail:string; ownerPassword:string }) {
    this.admin(user);
    const organizer = await this.db.$transaction(async tx => { const created=await tx.organizer.create({ data: { name:input.name,slug:slugify(input.slug),email:input.email,city:input.city,status:'PENDING' } }); const normalizedEmail=input.ownerEmail.trim().toLowerCase(); const owner=await tx.user.create({data:{firstName:input.ownerFirstName,lastName:input.ownerLastName,email:input.ownerEmail,normalizedEmail,passwordHash:await argon2.hash(input.ownerPassword),role:'ORGANIZER_ADMIN',status:'ACTIVE'}}); await tx.organizerMember.create({data:{organizerId:created.id,userId:owner.id,isOwner:true,permissions:['VIEW_DASHBOARD','MANAGE_TRIPS','PUBLISH_TRIPS','VIEW_BOOKINGS','MANAGE_BOOKINGS','VERIFY_PAYMENTS','EXPORT_PASSENGERS','VIEW_ANALYTICS','MANAGE_TEAM']}}); return created; });
    await this.audit(user, 'CREATE', 'Organizer', organizer.id);
    return organizer;
  }
  async updateOrganizer(user:AuthUser,id:string,input:{name?:string;email?:string;city?:string;commissionRate?:number}){this.admin(user);const item=await this.db.organizer.update({where:{id},data:input});await this.audit(user,'UPDATE','Organizer',id);return item;}

  async createCategory(user: AuthUser, input: { slug: string; nameAr: string; nameEn: string }) {
    this.admin(user);
    const category = await this.db.tripCategory.create({ data: { slug: slugify(input.slug), translations: { create: [{ locale: 'AR', name: input.nameAr }, { locale: 'EN', name: input.nameEn }] } }, include: { translations: true } });
    await this.audit(user, 'CREATE', 'TripCategory', category.id);
    return category;
  }

  async createDestination(user: AuthUser, input: { slug: string; nameAr: string; nameEn: string; city?: string; stateOrProvince?: string }) {
    this.admin(user);
    const destination = await this.db.destination.create({ data: { slug: slugify(input.slug), city: input.city ?? input.nameEn, stateOrProvince: input.stateOrProvince, translations: { create: [{ locale: 'AR', name: input.nameAr }, { locale: 'EN', name: input.nameEn }] } }, include: { translations: true } });
    await this.audit(user, 'CREATE', 'Destination', destination.id);
    return destination;
  }

  async createComplaint(user: AuthUser, input: { subject: string; description: string; organizerId?: string; bookingId?: string }) {
    this.admin(user);
    const complaint = await this.db.complaint.create({ data: input });
    await this.audit(user, 'CREATE', 'Complaint', complaint.id);
    return complaint;
  }

  async createTrip(user: AuthUser, input: { titleAr: string; titleEn: string; descriptionAr: string; descriptionEn: string; slug: string; categoryId: string; destinationId: string; departureCity: string; startAt: string; endAt: string; bookingDeadline: string; pricePerPerson: number; totalSeats: number; organizerId?:string }) {
    const organizerId = user.role==='SUPER_ADMIN' ? input.organizerId : await this.organizer(user);
    if(!organizerId)throw new BadRequestException('An organizer is required.');
    const [destination, category] = await Promise.all([this.db.destination.findUnique({ where: { id: input.destinationId }, include: { translations: true } }), this.db.tripCategory.findUnique({ where: { id: input.categoryId } })]);
    if (!destination || !category) throw new BadRequestException('A valid category and destination are required.');
    const startAt = validDate(input.startAt); const endAt = validDate(input.endAt); const bookingDeadline = validDate(input.bookingDeadline);
    if (!(bookingDeadline < startAt && startAt < endAt)) throw new BadRequestException('Booking deadline, start, and end dates are invalid.');
    const trip = await this.db.trip.create({ data: { organizerId, categoryId: input.categoryId, destinationId: input.destinationId, slug: slugify(input.slug), departureCity: input.departureCity, destinationNameSnapshot: destination.city, startAt, endAt, bookingDeadline, pricePerPerson: input.pricePerPerson, totalSeats: input.totalSeats, createdById: user.sub, translations: { create: [{ locale: 'AR', title: input.titleAr, description: input.descriptionAr, normalizedTitle: normalize(input.titleAr) }, { locale: 'EN', title: input.titleEn, description: input.descriptionEn, normalizedTitle: normalize(input.titleEn) }] } }, include: { translations: true } });
    await this.audit(user, 'CREATE', 'Trip', trip.id);
    return trip;
  }

  async updateTrip(user:AuthUser,id:string,input:{titleAr?:string;titleEn?:string;descriptionAr?:string;descriptionEn?:string;departureCity?:string;startAt?:string;endAt?:string;bookingDeadline?:string;pricePerPerson?:number;totalSeats?:number}) {
    const organizerId=user.role==='SUPER_ADMIN'?undefined:await this.organizer(user); const existing=await this.db.trip.findFirst({where:{id,...(organizerId?{organizerId}:{})},include:{translations:true}}); if(!existing)throw new NotFoundException(); if(input.totalSeats!==undefined&&input.totalSeats<existing.reservedSeats)throw new BadRequestException('Capacity cannot be lower than reserved seats.');
    const item=await this.db.trip.update({where:{id},data:{departureCity:input.departureCity,startAt:input.startAt?validDate(input.startAt):undefined,endAt:input.endAt?validDate(input.endAt):undefined,bookingDeadline:input.bookingDeadline?validDate(input.bookingDeadline):undefined,pricePerPerson:input.pricePerPerson,totalSeats:input.totalSeats,translations:{update:[...(input.titleAr||input.descriptionAr?[{where:{tripId_locale:{tripId:id,locale:'AR' as const}},data:{title:input.titleAr,description:input.descriptionAr,normalizedTitle:input.titleAr?normalize(input.titleAr):undefined}}]:[]),...(input.titleEn||input.descriptionEn?[{where:{tripId_locale:{tripId:id,locale:'EN' as const}},data:{title:input.titleEn,description:input.descriptionEn,normalizedTitle:input.titleEn?normalize(input.titleEn):undefined}}]:[])]}},include:{translations:true}}); await this.audit(user,'UPDATE','Trip',id); return item;
  }

  async createManagedBooking(user:AuthUser,role:string,input:{customerEmail:string;tripId:string;seatCount:number;travelerFirstName:string;travelerLastName:string;paymentMethod:'CASH'|'BANK_TRANSFER'|'PAYMENT_PROOF'}) {
    if(role==='admin')this.admin(user); else if(role!=='organizer')throw new NotFoundException(); const organizerId=user.role==='SUPER_ADMIN'?undefined:await this.organizer(user); const customer=await this.db.user.findUnique({where:{normalizedEmail:input.customerEmail.trim().toLowerCase()}}); if(!customer||customer.role!=='CUSTOMER')throw new BadRequestException('A customer account with this email is required.');
    const booking=await this.db.$transaction(async tx=>{const trip=await tx.trip.findFirst({where:{id:input.tripId,...(organizerId?{organizerId}:{})}});if(!trip)throw new NotFoundException('Trip not found.');const changed=await tx.trip.updateMany({where:{id:trip.id,reservedSeats:{lte:trip.totalSeats-input.seatCount}},data:{reservedSeats:{increment:input.seatCount}}});if(changed.count!==1)throw new BadRequestException('Not enough seats are available.');const subtotal=trip.pricePerPerson.mul(input.seatCount);return tx.booking.create({data:{bookingReference:`TRP-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').slice(0,6).toUpperCase()}`,customerId:customer.id,tripId:trip.id,organizerId:trip.organizerId,seatCount:input.seatCount,unitPrice:trip.pricePerPerson,subtotal,serviceFee:0,discountAmount:0,totalAmount:subtotal,currency:trip.currency,status:'PENDING_PAYMENT',paymentStatus:'UNPAID',idempotencyKey:`dashboard-${randomBytes(12).toString('hex')}`,travelers:{create:Array.from({length:input.seatCount},(_,index)=>({firstName:index===0?input.travelerFirstName:`Traveler ${index+1}`,lastName:index===0?input.travelerLastName:'Pending',isPrimary:index===0}))},payments:{create:{amount:subtotal,currency:trip.currency,method:input.paymentMethod,status:'UNPAID'}},history:{create:{newStatus:'PENDING_PAYMENT',actorUserId:user.sub}}},include:{travelers:true,payments:true}})});await this.audit(user,'CREATE','Booking',booking.id);return booking;
  }

  async updateBooking(user:AuthUser,id:string,input:{seatCount?:number;organizerNotes?:string;status?:'PENDING_PAYMENT'|'PAYMENT_REVIEW'|'CONFIRMED'|'CANCELLED_BY_ORGANIZER'|'COMPLETED'}) {
    const organizerId=user.role==='SUPER_ADMIN'?undefined:await this.organizer(user); return this.db.$transaction(async tx=>{const existing=await tx.booking.findFirst({where:{id,...(organizerId?{organizerId}:{})},include:{payments:true}});if(!existing)throw new NotFoundException();if(input.seatCount!==undefined&&input.seatCount!==existing.seatCount){const difference=input.seatCount-existing.seatCount;const trip=await tx.trip.findUniqueOrThrow({where:{id:existing.tripId}});if(difference>0&&trip.reservedSeats+difference>trip.totalSeats)throw new BadRequestException('Not enough seats are available.');await tx.trip.update({where:{id:trip.id},data:{reservedSeats:{increment:difference}}});}const confirmed=input.status==='CONFIRMED';const cancelled=input.status==='CANCELLED_BY_ORGANIZER'&&!existing.status.startsWith('CANCELLED');if(cancelled)await tx.trip.update({where:{id:existing.tripId},data:{reservedSeats:{decrement:existing.seatCount}}});const item=await tx.booking.update({where:{id},data:{seatCount:input.seatCount,organizerNotes:input.organizerNotes,status:input.status,confirmedAt:confirmed?new Date():undefined,cancelledAt:cancelled?new Date():undefined,paymentStatus:confirmed?'PAID':undefined,history:input.status?{create:{previousStatus:existing.status,newStatus:input.status,actorUserId:user.sub}}:undefined},include:{travelers:true,payments:true}});if(confirmed)await tx.payment.updateMany({where:{bookingId:id},data:{status:'PAID',verifiedAt:new Date(),verifiedById:user.sub}});return item;});
  }

  async createMember(user: AuthUser, input: { email: string; password: string; firstName: string; lastName: string }) {
    const organizerId = await this.organizer(user, true);
    const normalizedEmail = input.email.trim().toLowerCase();
    const member = await this.db.$transaction(async tx => {
      const account = await tx.user.create({ data: { firstName: input.firstName, lastName: input.lastName, email: input.email, normalizedEmail, passwordHash: await argon2.hash(input.password), role: UserRole.ORGANIZER_STAFF } });
      return tx.organizerMember.create({ data: { organizerId, userId: account.id, permissions: ['VIEW_DASHBOARD', 'VIEW_BOOKINGS'] }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true, status: true } } } });
    });
    await this.audit(user, 'CREATE', 'OrganizerMember', member.id);
    return member;
  }

  async updateCommission(user: AuthUser, id: string, commissionRate: number) {
    this.admin(user);
    const organizer = await this.db.organizer.update({ where: { id }, data: { commissionRate } });
    await this.audit(user, 'UPDATE_COMMISSION', 'Organizer', id, { commissionRate });
    return organizer;
  }

  async updateStatus(user: AuthUser, resource: string, id: string, input: { status: string; reason?: string }) {
    if (resource === 'organizers') {
      this.admin(user); assertEnum(input.status, OrganizerStatus);
      const item = await this.db.organizer.update({ where: { id }, data: { status: input.status as OrganizerStatus, approvedAt: input.status === 'APPROVED' ? new Date() : undefined, approvedById: input.status === 'APPROVED' ? user.sub : undefined } });
      await this.audit(user, 'STATUS_CHANGE', 'Organizer', id, input); return item;
    }
    if (resource === 'trips') {
      const organizerId = user.role === 'SUPER_ADMIN' ? undefined : await this.organizer(user);
      assertEnum(input.status, TripStatus);
      const existing = await this.db.trip.findFirst({ where: { id, ...(organizerId ? { organizerId } : {}) } }); if (!existing) throw new NotFoundException();
      const item = await this.db.trip.update({ where: { id }, data: { status: input.status as TripStatus, publishedAt: input.status === 'PUBLISHED' ? new Date() : undefined, cancelledAt: input.status === 'CANCELLED' ? new Date() : undefined, cancellationReason: input.status === 'CANCELLED' ? input.reason : undefined } });
      await this.audit(user, 'STATUS_CHANGE', 'Trip', id, input); return item;
    }
    if (resource === 'bookings') {
      const organizerId = user.role === 'SUPER_ADMIN' ? undefined : await this.organizer(user);
      assertEnum(input.status, BookingStatus);
      const existing = await this.db.booking.findFirst({ where: { id, ...(organizerId ? { organizerId } : {}) } }); if (!existing) throw new NotFoundException();
      const confirmed=input.status==='CONFIRMED'; const cancelled=input.status==='CANCELLED_BY_ORGANIZER'&&!existing.status.startsWith('CANCELLED'); const item = await this.db.booking.update({ where: { id }, data: { status: input.status as BookingStatus, confirmedAt: confirmed ? new Date() : undefined, cancelledAt:cancelled?new Date():undefined,paymentStatus:confirmed?'PAID':undefined,cancellationReason: input.reason, history: { create: { previousStatus: existing.status, newStatus: input.status as BookingStatus, actorUserId: user.sub, reason: input.reason } } } }); if(confirmed)await this.db.payment.updateMany({where:{bookingId:id},data:{status:'PAID',verifiedAt:new Date(),verifiedById:user.sub}});if(cancelled)await this.db.trip.update({where:{id:existing.tripId},data:{reservedSeats:{decrement:existing.seatCount}}});
      await this.audit(user, 'STATUS_CHANGE', 'Booking', id, input); return item;
    }
    if (resource === 'payments') {
      const organizerId = user.role === 'SUPER_ADMIN' ? undefined : await this.organizer(user);
      assertEnum(input.status, PaymentStatus);
      const existing = await this.db.payment.findFirst({ where: { id, ...(organizerId ? { booking: { organizerId } } : {}) } }); if (!existing) throw new NotFoundException();
      const item = await this.db.payment.update({ where: { id }, data: { status: input.status as PaymentStatus, verifiedAt: ['PAID','REJECTED'].includes(input.status) ? new Date() : undefined, verifiedById: user.sub, rejectionReason: input.status === 'REJECTED' ? input.reason : undefined } });
      await this.db.booking.update({ where: { id: existing.bookingId }, data: { paymentStatus: input.status as PaymentStatus, status: input.status === 'PAID' ? 'CONFIRMED' : undefined, confirmedAt: input.status === 'PAID' ? new Date() : undefined } });
      await this.audit(user, 'STATUS_CHANGE', 'Payment', id, input); return item;
    }
    if (resource === 'complaints') {
      this.admin(user); assertEnum(input.status, ComplaintStatus);
      const item = await this.db.complaint.update({ where: { id }, data: { status: input.status as ComplaintStatus, resolution: input.reason, resolvedAt: input.status === 'RESOLVED' ? new Date() : undefined } });
      await this.audit(user, 'STATUS_CHANGE', 'Complaint', id, input); return item;
    }
    if (resource === 'categories' || resource === 'destinations') {
      this.admin(user); if (!['ACTIVE','INACTIVE'].includes(input.status)) throw new BadRequestException('Unsupported catalog status.');
      const item = resource === 'categories' ? await this.db.tripCategory.update({where:{id},data:{isActive:input.status==='ACTIVE'}}) : await this.db.destination.update({where:{id},data:{isActive:input.status==='ACTIVE'}});
      await this.audit(user,'STATUS_CHANGE',resource==='categories'?'TripCategory':'Destination',id,input); return item;
    }
    if (resource === 'team') {
      const organizerId=await this.organizer(user,true); if(!['ACTIVE','DISABLED'].includes(input.status))throw new BadRequestException('Unsupported member status.'); const membership=await this.db.organizerMember.findFirst({where:{id,organizerId,isOwner:false}}); if(!membership)throw new NotFoundException(); const item=await this.db.user.update({where:{id:membership.userId},data:{status:input.status==='ACTIVE'?'ACTIVE':'DISABLED'}}); await this.audit(user,'STATUS_CHANGE','OrganizerMember',id,input); return item;
    }
    throw new NotFoundException('Resource not found.');
  }

  private async adminSection(section: string) {
    switch (section) {
      case 'overview': { const [organizers,trips,bookings,revenue,capacity]=await Promise.all([this.db.organizer.count({where:{status:'APPROVED',deletedAt:null}}),this.db.trip.count({where:{status:'PUBLISHED',deletedAt:null}}),this.db.booking.count({where:{status:'CONFIRMED'}}),this.db.payment.aggregate({where:{status:'PAID'},_sum:{amount:true}}),this.db.trip.aggregate({where:{deletedAt:null},_sum:{reservedSeats:true,totalSeats:true}})]); const occupancy=capacity._sum.totalSeats?Math.round(((capacity._sum.reservedSeats??0)/capacity._sum.totalSeats)*100):0; return { metrics:{organizers,trips,bookings,revenue:`${revenue._sum.amount??0} DZD`,occupancy:`${occupancy}%`}, items:await this.db.auditLog.findMany({take:5,orderBy:{createdAt:'desc'}}) }; }
      case 'organizers': return { items: await this.db.organizer.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { trips: true, bookings: true, members: true } } } }) };
      case 'trips': return { items: await this.db.trip.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, include: { organizer: { select: { name: true } }, translations: true } }) };
      case 'bookings': return { items: await this.bookings() };
      case 'payments': return { items: await this.payments() };
      case 'categories': return { items: await this.db.tripCategory.findMany({ orderBy: { createdAt: 'desc' }, include: { translations: true, _count: { select: { trips: true } } } }) };
      case 'destinations': return { items: await this.db.destination.findMany({ orderBy: { createdAt: 'desc' }, include: { translations: true, _count: { select: { trips: true } } } }) };
      case 'complaints': return { items: await this.db.complaint.findMany({ orderBy: { createdAt: 'desc' } }) };
      case 'commissions': return { items: await this.db.organizer.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true, commissionRate: true, updatedAt: true, status: true } }) };
      case 'audit-logs': return { items: await this.db.auditLog.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) };
      default: throw new NotFoundException('Dashboard section not found.');
    }
  }

  private async organizerSection(organizerId: string, section: string) {
    switch (section) {
      case 'overview': { const [trips,bookings,payments,revenue,capacity]=await Promise.all([this.db.trip.count({where:{organizerId,status:{in:['PUBLISHED','FULL']}}}),this.db.booking.count({where:{organizerId,status:'CONFIRMED'}}),this.db.payment.count({where:{booking:{organizerId},status:'PENDING_VERIFICATION'}}),this.db.payment.aggregate({where:{booking:{organizerId},status:'PAID'},_sum:{amount:true}}),this.db.trip.aggregate({where:{organizerId},_sum:{reservedSeats:true,totalSeats:true}})]);const occupancy=capacity._sum.totalSeats?Math.round(((capacity._sum.reservedSeats??0)/capacity._sum.totalSeats)*100):0;return { metrics:{trips,bookings,payments,revenue:`${revenue._sum.amount??0} DZD`,occupancy:`${occupancy}%`}, items:await this.bookings(organizerId).then(items=>items.slice(0,5)) }; }
      case 'trips': return { items: await this.db.trip.findMany({ where: { organizerId, deletedAt: null }, orderBy: { createdAt: 'desc' }, include: { translations: true } }) };
      case 'bookings': return { items: await this.bookings(organizerId) };
      case 'travelers': return { items: await this.db.traveler.findMany({ where: { booking: { organizerId } }, orderBy: { createdAt: 'desc' }, include: { booking: { select: { bookingReference: true, trip: { select: { translations: true } } } } } }) };
      case 'payments': return { items: await this.payments(organizerId) };
      case 'team': return { items: await this.db.organizerMember.findMany({ where: { organizerId }, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true } } } }) };
      case 'analytics': return this.analytics(organizerId);
      default: throw new NotFoundException('Dashboard section not found.');
    }
  }

  private bookings(organizerId?: string) { return this.db.booking.findMany({ where: organizerId ? { organizerId } : {}, orderBy: { createdAt: 'desc' }, include: { customer: { select: { firstName: true, lastName: true, email: true } }, trip: { select: { translations: true } }, payments: true, travelers: true } }); }
  private payments(organizerId?: string) { return this.db.payment.findMany({ where: organizerId ? { booking: { organizerId } } : {}, orderBy: { createdAt: 'desc' }, include: { booking: { select: { bookingReference: true, customer: { select: { firstName: true, lastName: true } }, organizer: { select: { name: true } } } } } }); }
  private async analytics(organizerId: string) { const [trips, bookings, revenue] = await Promise.all([this.db.trip.count({ where: { organizerId } }), this.db.booking.count({ where: { organizerId } }), this.db.payment.aggregate({ where: { status: 'PAID', booking: { organizerId } }, _sum: { amount: true } })]); return { metrics: { trips, bookings, revenue: revenue._sum.amount ?? 0 }, items: await this.db.trip.findMany({ where: { organizerId }, include: { translations: true, _count: { select: { bookings: true } } }, orderBy: { startAt: 'desc' } }) }; }
  private admin(user: AuthUser) { if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Super-admin access is required.'); }
  private async organizer(user: AuthUser, owner = false) { if (!['ORGANIZER_ADMIN','ORGANIZER_STAFF'].includes(user.role)) throw new ForbiddenException('Organizer access is required.'); const membership = await this.db.organizerMember.findFirst({ where: { userId: user.sub, ...(owner ? { isOwner: true } : {}) } }); if (!membership) throw new ForbiddenException('Organizer membership is required.'); return membership.organizerId; }
  private audit(user: AuthUser, action: string, resourceType: string, resourceId?: string, metadata?: object) { return this.db.auditLog.create({ data: { actorUserId: user.sub, action, resourceType, resourceId, metadata } }); }
}

function slugify(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function normalize(value: string) { return value.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').trim().toLowerCase(); }
function validDate(value: string) { const date = new Date(value); if (Number.isNaN(date.getTime())) throw new BadRequestException('A valid date is required.'); return date; }
function assertEnum(value: string, values: object): void { if (!Object.values(values).includes(value)) throw new BadRequestException(`Unsupported status: ${value}`); }
