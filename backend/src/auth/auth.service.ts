import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
@Injectable()
export class AuthService {
  constructor(private readonly db: PrismaService, private readonly jwt: JwtService) {}
  async register(input: { firstName: string; lastName: string; email: string; phone:string; password: string }, request: Request) {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (await this.db.user.findUnique({ where: { normalizedEmail } })) throw new ConflictException('An account with this email already exists.');
    const normalizedPhone=input.phone.replace(/[^+\d]/g,'');
    if(await this.db.user.findFirst({where:{normalizedPhone}}))throw new ConflictException('An account with this phone number already exists.');
    const user = await this.db.user.create({ data: { firstName: input.firstName, lastName: input.lastName, email: input.email, normalizedEmail, phone:input.phone,normalizedPhone,passwordHash: await argon2.hash(input.password) } });
    return this.createSession(user, request);
  }
  async login(input: { email: string; password: string }, request: Request) {
    const user = await this.db.user.findUnique({ where: { normalizedEmail: input.email.trim().toLowerCase() } });
    if (!user) throw new NotFoundException('ACCOUNT_NOT_FOUND');
    if (user.status !== 'ACTIVE' || !(await argon2.verify(user.passwordHash, input.password))) throw new UnauthorizedException('Invalid email or password.');
    await this.db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }); return this.createSession(user, request);
  }
  async refresh(raw: string, request: Request) {
    let claims: { sub: string; sid: string }; try { claims = await this.jwt.verifyAsync(raw, { secret: process.env.JWT_REFRESH_SECRET }); } catch { throw new UnauthorizedException(); }
    const session = await this.db.session.findUnique({ where: { id: claims.sid }, include: { user: true } });
    if (!session || session.revokedAt || session.expiresAt < new Date() || !(await argon2.verify(session.refreshTokenHash, raw))) throw new UnauthorizedException();
    await this.db.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } }); return this.createSession(session.user, request);
  }
  async logout(raw: string) { try { const claims = await this.jwt.verifyAsync<{ sid: string }>(raw, { secret: process.env.JWT_REFRESH_SECRET }); await this.db.session.updateMany({ where: { id: claims.sid, revokedAt: null }, data: { revokedAt: new Date() } }); } catch {} return { loggedOut: true }; }
  async me(id: string, locale?: string) { return this.db.user.findUniqueOrThrow({ where: { id }, select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true, locale: true, memberships: { select: { organizerId: true, permissions: true, isOwner: true } } } }); }
  private async createSession(user: { id: string; role: string }, request: Request) {
    const session = await this.db.session.create({ data: { userId: user.id, refreshTokenHash: 'pending', userAgent: request.get('user-agent'), ipAddress: request.ip, expiresAt: new Date(Date.now() + 30 * 86_400_000) } });
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role }, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' });
    const refreshToken = await this.jwt.signAsync({ sub: user.id, sid: session.id }, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '30d' });
    await this.db.session.update({ where: { id: session.id }, data: { refreshTokenHash: await argon2.hash(refreshToken) } }); return { accessToken, refreshToken };
  }
}
