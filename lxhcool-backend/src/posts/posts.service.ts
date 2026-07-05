import { Injectable, NotFoundException } from '@nestjs/common';
import { PostType, Prisma, PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic(type?: PostType) {
    return this.prisma.post.findMany({
      where: { status: PublishStatus.PUBLISHED, type },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getPublicBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  listAdmin(type?: PostType) {
    return this.prisma.post.findMany({
      where: { type },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getAdminById(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  create(dto: CreatePostDto) {
    const status = dto.status ?? PublishStatus.PUBLISHED;
    return this.prisma.post.create({
      data: {
        ...dto,
        status,
        media: (dto.media ?? {}) as Prisma.InputJsonValue,
        publishedAt: status === PublishStatus.PUBLISHED ? new Date() : null,
      },
    });
  }

  update(id: string, dto: UpdatePostDto) {
    return this.updateWithPublishDate(id, dto);
  }

  private async updateWithPublishDate(id: string, dto: UpdatePostDto) {
    const existing = await this.getAdminById(id);
    const shouldSetPublishedAt =
      dto.status === PublishStatus.PUBLISHED && existing.status !== PublishStatus.PUBLISHED;

    return this.prisma.post.update({
      where: { id },
      data: {
        ...dto,
        media: dto.media as Prisma.InputJsonValue | undefined,
        publishedAt: shouldSetPublishedAt ? { set: existing.publishedAt ?? new Date() } : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }
}
