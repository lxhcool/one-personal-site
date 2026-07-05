import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomInt, createHash } from 'node:crypto';
import { VerificationPurpose } from '@prisma/client';
import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { requireJwtSecret } from '../config/env';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestRegisterCodeDto } from './dto/request-register-code.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MailService } from './mail.service';
import { signSession, verifySession } from './session';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async requestRegisterCode(dto: RequestRegisterCodeDto) {
    const email = dto.email.toLowerCase();
    const existed = await this.prisma.adminUser.findUnique({ where: { email } });
    if (existed) throw new ConflictException('Email already registered');

    const code = String(randomInt(100000, 1000000));
    await this.prisma.emailVerificationCode.create({
      data: {
        email,
        codeHash: this.hashCode(email, code),
        purpose: VerificationPurpose.REGISTER,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await this.mail.sendVerificationCode(email, code);
    return { email };
  }

  async register(dto: RegisterDto, res: Response) {
    const email = dto.email.toLowerCase();
    const existed = await this.prisma.adminUser.findUnique({ where: { email } });
    if (existed) throw new ConflictException('Email already registered');

    const codeRecord = await this.prisma.emailVerificationCode.findFirst({
      where: {
        email,
        purpose: VerificationPurpose.REGISTER,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!codeRecord) throw new BadRequestException('Verification code expired');
    if (codeRecord.attempts >= 5) throw new BadRequestException('Too many verification attempts');

    const codeHash = this.hashCode(email, dto.code);
    if (codeHash !== codeRecord.codeHash) {
      await this.prisma.emailVerificationCode.update({
        where: { id: codeRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid verification code');
    }

    const user = await this.prisma.adminUser.create({
      data: {
        email,
        name: dto.name,
        passwordHash: await argon2.hash(dto.password),
      },
    });

    await this.prisma.emailVerificationCode.update({
      where: { id: codeRecord.id },
      data: { consumedAt: new Date() },
    });

    this.setSessionCookie(res, user.id, user.email);
    return this.toAdminUser(user);
  }

  async login(dto: LoginDto, res: Response) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.setSessionCookie(res, user.id, user.email);
    return this.toAdminUser(user);
  }

  logout(res: Response) {
    res.clearCookie('admin_session', { path: '/' });
    return true;
  }

  async me(req: Request) {
    const session = this.requireSession(req);

    const user = await this.prisma.adminUser.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, name: true, avatar: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException('Admin login required');
    return user;
  }

  async updateProfile(req: Request, dto: UpdateProfileDto) {
    const session = this.requireSession(req);
    const user = await this.prisma.adminUser.update({
      where: { id: session.sub },
      data: {
        name: dto.name?.trim() || null,
        avatar: dto.avatar?.trim() || null,
      },
      select: { id: true, email: true, name: true, avatar: true, createdAt: true },
    });

    return user;
  }

  private requireSession(req: Request) {
    const session = verifySession(req.cookies?.admin_session);
    if (!session) throw new UnauthorizedException('Admin login required');
    return session;
  }

  private setSessionCookie(res: Response, userId: string, email: string) {
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    const token = signSession({
      sub: userId,
      email,
      exp: Math.floor((Date.now() + maxAge) / 1000),
    });

    res.cookie('admin_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge,
    });
  }

  private hashCode(email: string, code: string) {
    return createHash('sha256')
      .update(`${email}:${code}:${requireJwtSecret()}`)
      .digest('hex');
  }

  private toAdminUser(user: { id: string; email: string; name: string | null; avatar?: string | null }) {
    return { id: user.id, email: user.email, name: user.name, avatar: user.avatar ?? null };
  }
}
