import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { verifySession } from './session';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const session = verifySession(request.cookies?.admin_session);
    if (session) {
      return true;
    }
    throw new UnauthorizedException('Admin login required');
  }
}
