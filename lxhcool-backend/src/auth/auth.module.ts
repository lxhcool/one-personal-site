import { Module } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AdminAuthGuard, MailService],
  exports: [AdminAuthGuard],
})
export class AuthModule {}
