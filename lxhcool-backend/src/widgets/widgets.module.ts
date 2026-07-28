import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminWidgetsController } from './admin-widgets.controller';
import { PublicWidgetsController } from './public-widgets.controller';
import { WidgetsService } from './widgets.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicWidgetsController, AdminWidgetsController],
  providers: [WidgetsService],
})
export class WidgetsModule {}
