import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic(featured?: string) {
    const where: Prisma.ProjectWhereInput = { status: PublishStatus.PUBLISHED };
    if (featured === 'true') where.featured = true;

    return this.prisma.project.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
    });
  }

  async getPublicBySlug(slug: string) {
    const project = await this.prisma.project.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  listAdmin() {
    return this.prisma.project.findMany({
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async getAdminById(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  create(dto: CreateProjectDto) {
    const status = dto.status ?? PublishStatus.PUBLISHED;
    return this.prisma.project.create({
      data: {
        ...dto,
        status,
        publishedAt: status === PublishStatus.PUBLISHED ? new Date() : null,
      },
    });
  }

  update(id: string, dto: UpdateProjectDto) {
    return this.updateWithPublishDate(id, dto);
  }

  private async updateWithPublishDate(id: string, dto: UpdateProjectDto) {
    const existing = await this.getAdminById(id);
    const shouldSetPublishedAt =
      dto.status === PublishStatus.PUBLISHED && existing.status !== PublishStatus.PUBLISHED;

    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        publishedAt: shouldSetPublishedAt ? { set: existing.publishedAt ?? new Date() } : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
