import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ok } from '../common/api-response';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@Controller()
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get('public/posts')
  async listPublic(@Query('type') type?: 'ARTICLE' | 'MOMENT') {
    return ok(await this.posts.listPublic(type));
  }

  @Get('public/posts/:slug')
  async getPublic(@Param('slug') slug: string) {
    return ok(await this.posts.getPublicBySlug(slug));
  }

  @Get('admin/posts')
  @UseGuards(AdminAuthGuard)
  async listAdmin(@Query('type') type?: 'ARTICLE' | 'MOMENT') {
    return ok(await this.posts.listAdmin(type));
  }

  @Get('admin/posts/:id')
  @UseGuards(AdminAuthGuard)
  async getAdmin(@Param('id') id: string) {
    return ok(await this.posts.getAdminById(id));
  }

  @Post('admin/posts')
  @UseGuards(AdminAuthGuard)
  async create(@Body() dto: CreatePostDto) {
    return ok(await this.posts.create(dto));
  }

  @Patch('admin/posts/:id')
  @UseGuards(AdminAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return ok(await this.posts.update(id, dto));
  }

  @Delete('admin/posts/:id')
  @UseGuards(AdminAuthGuard)
  async remove(@Param('id') id: string) {
    return ok(await this.posts.remove(id));
  }
}
