import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ok } from '../common/api-response';
import { CreateFriendLinkDto } from './dto/create-friend-link.dto';
import { UpdateFriendLinkDto } from './dto/update-friend-link.dto';
import { FriendLinksService } from './friend-links.service';

@Controller()
export class FriendLinksController {
  constructor(private readonly friendLinks: FriendLinksService) {}

  @Get('public/friend-links')
  async listPublic() {
    return ok(await this.friendLinks.listPublic());
  }

  @Get('admin/friend-links')
  @UseGuards(AdminAuthGuard)
  async listAdmin() {
    return ok(await this.friendLinks.listAdmin());
  }

  @Get('admin/friend-links/:id')
  @UseGuards(AdminAuthGuard)
  async getAdmin(@Param('id') id: string) {
    return ok(await this.friendLinks.getAdminById(id));
  }

  @Post('admin/friend-links')
  @UseGuards(AdminAuthGuard)
  async create(@Body() dto: CreateFriendLinkDto) {
    return ok(await this.friendLinks.create(dto));
  }

  @Patch('admin/friend-links/:id')
  @UseGuards(AdminAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateFriendLinkDto) {
    return ok(await this.friendLinks.update(id, dto));
  }

  @Delete('admin/friend-links/:id')
  @UseGuards(AdminAuthGuard)
  async remove(@Param('id') id: string) {
    return ok(await this.friendLinks.remove(id));
  }
}
