import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFriendLinkDto } from './dto/create-friend-link.dto';
import { UpdateFriendLinkDto } from './dto/update-friend-link.dto';

@Injectable()
export class FriendLinksService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic() {
    return this.prisma.friendLink.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  listAdmin() {
    return this.prisma.friendLink.findMany({
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async getAdminById(id: string) {
    const friendLink = await this.prisma.friendLink.findUnique({ where: { id } });
    if (!friendLink) throw new NotFoundException('Friend link not found');
    return friendLink;
  }

  create(dto: CreateFriendLinkDto) {
    return this.prisma.friendLink.create({ data: dto });
  }

  update(id: string, dto: UpdateFriendLinkDto) {
    return this.prisma.friendLink.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.friendLink.delete({ where: { id } });
  }
}
