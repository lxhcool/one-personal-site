import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';

@Injectable()
export class WidgetsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic() {
    return this.prisma.siteWidget.findMany({
      where: { enabled: true },
      orderBy: [{ area: 'asc' }, { verticalPosition: 'asc' }, { sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  listAdmin() {
    return this.prisma.siteWidget.findMany({
      orderBy: [{ area: 'asc' }, { verticalPosition: 'asc' }, { sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async create(dto: CreateWidgetDto) {
    const existing = await this.prisma.siteWidget.findFirst({
      where: { type: dto.type },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('This widget type already exists');
    }

    return this.prisma.siteWidget.create({
      data: {
        area: dto.area,
        verticalPosition: dto.verticalPosition ?? 'TOP',
        rotation: dto.rotation ?? 0,
        type: dto.type,
        title: dto.title?.trim() || null,
        enabled: dto.enabled ?? true,
        sortOrder: dto.sortOrder ?? 0,
        config: (dto.config ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  update(id: string, dto: UpdateWidgetDto) {
    return this.prisma.siteWidget.update({
      where: { id },
      data: {
        area: dto.area,
        verticalPosition: dto.verticalPosition,
        rotation: dto.rotation,
        type: dto.type,
        title: dto.title === undefined ? undefined : dto.title?.trim() || null,
        enabled: dto.enabled,
        sortOrder: dto.sortOrder,
        config: dto.config as Prisma.InputJsonValue | undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.siteWidget.delete({ where: { id } });
  }
}
