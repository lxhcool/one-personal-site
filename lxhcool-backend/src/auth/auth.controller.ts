import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AdminAuthGuard } from './admin-auth.guard';
import { ok } from '../common/api-response';
import { ApiDataResponse } from '../common/openapi-response.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiDataResponse(AdminUserResponseDto, { status: 201 })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return ok(await this.auth.register(dto, res));
  }

  @Post('login')
  @ApiDataResponse(AdminUserResponseDto, { status: 201 })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return ok(await this.auth.login(dto, res));
  }

  @Post('logout')
  @ApiResponse({
    status: 201,
    schema: {
      type: 'object',
      required: ['success', 'data'],
      properties: {
        success: { type: 'boolean', enum: [true] },
        data: { type: 'boolean', enum: [true] },
      },
    },
  })
  logout(@Res({ passthrough: true }) res: Response) {
    return ok(this.auth.logout(res));
  }

  @Get('me')
  @ApiDataResponse(AdminUserResponseDto)
  async me(@Req() req: Request) {
    return ok(await this.auth.me(req));
  }

  @Patch('profile')
  @UseGuards(AdminAuthGuard)
  @ApiDataResponse(AdminUserResponseDto)
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return ok(await this.auth.updateProfile(req, dto));
  }
}
