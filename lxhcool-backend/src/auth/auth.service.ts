import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { signSession, verifySession } from './session';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto, res: Response) {
    const email = dto.email.toLowerCase();
    const existed = await this.prisma.adminUser.findUnique({ where: { email } });
    if (existed) throw new ConflictException('Email already registered');

    const user = await this.prisma.adminUser.create({
      data: {
        email,
        name: dto.name,
        passwordHash: await argon2.hash(dto.password),
      },
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

  private toAdminUser(user: { id: string; email: string; name: string | null; avatar?: string | null }) {
    return { id: user.id, email: user.email, name: user.name, avatar: user.avatar ?? null };
  }
}
