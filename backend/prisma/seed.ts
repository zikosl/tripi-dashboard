import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required.');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const seedPassword = process.env.SEED_DEFAULT_PASSWORD ?? (process.env.NODE_ENV === 'production' ? undefined : 'TripiDev2026!');
  if (!seedPassword) throw new Error('SEED_DEFAULT_PASSWORD is required when seeding production.');
  const hash = await argon2.hash(seedPassword);
  const admin = await db.user.upsert({ where:{normalizedEmail:'admin@tripi.local'}, update:{}, create:{firstName:'Tripi',lastName:'Admin',email:'admin@tripi.local',normalizedEmail:'admin@tripi.local',passwordHash:hash,role:'SUPER_ADMIN'} });
  const organizer = await db.organizer.upsert({ where:{slug:'sahara-discovery'}, update:{}, create:{name:'Sahara Discovery',slug:'sahara-discovery',email:'hello@sahara.local',city:'Algiers',status:'APPROVED',approvedAt:new Date(),approvedById:admin.id,commissionRate:10} });
  const owner = await db.user.upsert({ where:{normalizedEmail:'organizer@tripi.local'}, update:{}, create:{firstName:'Amine',lastName:'Benali',email:'organizer@tripi.local',normalizedEmail:'organizer@tripi.local',passwordHash:hash,role:'ORGANIZER_ADMIN'} });
  await db.organizerMember.upsert({ where:{organizerId_userId:{organizerId:organizer.id,userId:owner.id}}, update:{}, create:{organizerId:organizer.id,userId:owner.id,isOwner:true,permissions:['VIEW_DASHBOARD','MANAGE_TRIPS','PUBLISH_TRIPS','VIEW_BOOKINGS','MANAGE_BOOKINGS','VERIFY_PAYMENTS','EXPORT_PASSENGERS','VIEW_ANALYTICS','MANAGE_TEAM']} });
  const destination = await db.destination.upsert({ where:{slug:'djanet'}, update:{}, create:{slug:'djanet',city:'Djanet',translations:{create:[{locale:'EN',name:'Djanet'},{locale:'AR',name:'جانت'}]}} });
  const category = await db.tripCategory.upsert({ where:{slug:'desert'}, update:{}, create:{slug:'desert',icon:'tent-tree',translations:{create:[{locale:'EN',name:'Desert trips'},{locale:'AR',name:'رحلات صحراوية'}]}} });
  const trip = await db.trip.upsert({ where:{slug:'djanet-desert-weekend'}, update:{}, create:{organizerId:organizer.id,categoryId:category.id,destinationId:destination.id,slug:'djanet-desert-weekend',departureCity:'Algiers',destinationNameSnapshot:'Djanet',startAt:new Date('2026-11-12T07:00:00Z'),endAt:new Date('2026-11-15T18:00:00Z'),bookingDeadline:new Date('2026-11-09T23:00:00Z'),pricePerPerson:28500,totalSeats:24,reservedSeats:1,status:'PUBLISHED',publishedAt:new Date(),createdById:owner.id,translations:{create:[{locale:'EN',title:'Djanet Desert Weekend',description:'Discover the Sahara with experienced local guides.',normalizedTitle:'djanet desert weekend'},{locale:'AR',title:'عطلة جانت الصحراوية',description:'اكتشف الصحراء مع مرشدين محليين ذوي خبرة.',normalizedTitle:'عطلة جانت الصحراوية'}]}} });
  const customer = await db.user.upsert({ where:{normalizedEmail:'customer@tripi.local'}, update:{}, create:{firstName:'Sara',lastName:'Khelifi',email:'customer@tripi.local',normalizedEmail:'customer@tripi.local',passwordHash:hash,role:'CUSTOMER'} });
  const booking = await db.booking.upsert({ where:{customerId_idempotencyKey:{customerId:customer.id,idempotencyKey:'seed-booking'}}, update:{}, create:{bookingReference:'TRP-2026-SEED01',customerId:customer.id,tripId:trip.id,organizerId:organizer.id,seatCount:1,unitPrice:28500,subtotal:28500,serviceFee:0,discountAmount:0,totalAmount:28500,currency:'DZD',status:'PAYMENT_REVIEW',paymentStatus:'PENDING_VERIFICATION',idempotencyKey:'seed-booking',travelers:{create:{firstName:'Sara',lastName:'Khelifi',phone:'+213555000256',isPrimary:true}},payments:{create:{amount:28500,currency:'DZD',method:'PAYMENT_PROOF',status:'PENDING_VERIFICATION',submittedAt:new Date()}},history:{create:{newStatus:'PAYMENT_REVIEW',actorUserId:customer.id}}} });
  const complaint = await db.complaint.findFirst({where:{bookingId:booking.id,subject:'Payment review delay'}});
  if (!complaint) await db.complaint.create({data:{bookingId:booking.id,organizerId:organizer.id,customerId:customer.id,subject:'Payment review delay',description:'The uploaded payment proof is awaiting review.',status:'OPEN'}});
  const audit = await db.auditLog.findFirst({where:{action:'SEED',resourceId:organizer.id}});
  if (!audit) await db.auditLog.create({data:{actorUserId:admin.id,action:'SEED',resourceType:'Organizer',resourceId:organizer.id}});
}

main().finally(() => db.$disconnect());
