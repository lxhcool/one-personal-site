import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ok } from '../common/api-response';
import { ApiDataResponse } from '../common/openapi-response.decorator';
import { CreateFriendLinkDto } from './dto/create-friend-link.dto';
import { FriendLinkResponseDto } from './dto/friend-link-response.dto';
import { UpdateFriendLinkDto } from './dto/update-friend-link.dto';
import { FriendLinksService } from './friend-links.service';

@Controller('admin/friend-links')
@UseGuards(AdminAuthGuard)
@ApiTags('Admin Friend Links')
export class AdminFriendLinksController {
  constructor(private readonly friendLinks: FriendLinksService) {}

  @Get()
  @ApiDataResponse(FriendLinkResponseDto, { isArray: true })
  async list() {
    return ok(FriendLinkResponseDto.fromMany(await this.friendLinks.listAdmin()));
  }

  @Get(':id')
  @ApiDataResponse(FriendLinkResponseDto)
  async getById(@Param('id') id: string) {
    return ok(FriendLinkResponseDto.from(await this.friendLinks.getAdminById(id)));
  }

  @Post()
  @ApiDataResponse(FriendLinkResponseDto, { status: 201 })
  async create(@Body() dto: CreateFriendLinkDto) {
    return ok(FriendLinkResponseDto.from(await this.friendLinks.create(dto)));
  }

  @Patch(':id')
  @ApiDataResponse(FriendLinkResponseDto)
  async update(@Param('id') id: string, @Body() dto: UpdateFriendLinkDto) {
    return ok(FriendLinkResponseDto.from(await this.friendLinks.update(id, dto)));
  }

  @Delete(':id')
  @ApiDataResponse(FriendLinkResponseDto)
  async remove(@Param('id') id: string) {
    return ok(FriendLinkResponseDto.from(await this.friendLinks.remove(id)));
  }
}
