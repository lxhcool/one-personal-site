import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminAuthGuard } from './admin-auth.guard';
import { ok } from '../common/api-response';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return ok(await this.auth.register(dto, res));
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return ok(await this.auth.login(dto, res));
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return ok(this.auth.logout(res));
  }

  @Get('me')
  async me(@Req() req: Request) {
    return ok(await this.auth.me(req));
  }

  @Patch('profile')
  @UseGuards(AdminAuthGuard)
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return ok(await this.auth.updateProfile(req, dto));
  }
}
