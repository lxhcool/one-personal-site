import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoryType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(type?: CategoryType) {
    return this.prisma.contentCategory.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateCategoryDto) {
    const name = this.normalizeName(dto.name);
    await this.ensureUnique(dto.type, name);
    return this.prisma.contentCategory.create({
      data: {
        type: dto.type,
        name,
        logo: dto.logo?.trim() || null,
        backgroundImage: dto.backgroundImage?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.getById(id);
    const nextType = dto.type ?? existing.type;
    const nextName = dto.name ? this.normalizeName(dto.name) : existing.name;

    if (nextType !== existing.type || nextName !== existing.name) {
      await this.ensureUnique(nextType, nextName);
    }

    const updated = await this.prisma.contentCategory.update({
      where: { id },
      data: {
        type: nextType,
        name: nextName,
        logo: dto.logo === undefined ? existing.logo : dto.logo?.trim() || null,
        backgroundImage:
          dto.backgroundImage === undefined
            ? existing.backgroundImage
            : dto.backgroundImage?.trim() || null,
        sortOrder: dto.sortOrder ?? existing.sortOrder,
      },
    });

    if (nextName !== existing.name || nextType !== existing.type) {
      await this.syncContentCategory(existing.type, existing.name, nextType, nextName);
    }

    return updated;
  }

  async remove(id: string) {
    const existing = await this.getById(id);
    await this.syncContentCategory(existing.type, existing.name, existing.type, null);
    return this.prisma.contentCategory.delete({ where: { id } });
  }

  private async getById(id: string) {
    const category = await this.prisma.contentCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  private normalizeName(name: string) {
    const normalized = name.trim();
    if (!normalized) throw new ConflictException('Category name is required');
    return normalized;
  }

  private async ensureUnique(type: CategoryType, name: string) {
    const existing = await this.prisma.contentCategory.findUnique({
      where: { type_name: { type, name } },
    });
    if (existing) throw new ConflictException('Category already exists');
  }

  private async syncContentCategory(
    oldType: CategoryType,
    oldName: string,
    newType: CategoryType,
    newName: string | null,
  ) {
    if (oldType === CategoryType.POST) {
      await this.prisma.post.updateMany({
        where: { category: oldName },
        data: newType === CategoryType.POST ? { category: newName } : { category: null },
      });
      return;
    }

    await this.prisma.friendLink.updateMany({
      where: { category: oldName },
      data: newType === CategoryType.FRIEND_LINK ? { category: newName } : { category: null },
    });
  }
}
