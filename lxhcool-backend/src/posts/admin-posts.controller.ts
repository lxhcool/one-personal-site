import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ok } from '../common/api-response';
import { ApiDataResponse } from '../common/openapi-response.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@Controller('admin/posts')
@UseGuards(AdminAuthGuard)
@ApiTags('Admin Posts')
export class AdminPostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  @ApiDataResponse(PostResponseDto, { isArray: true })
  async list(@Query('type') type?: 'ARTICLE' | 'MOMENT') {
    return ok(PostResponseDto.fromMany(await this.posts.listAdmin(type)));
  }

  @Get(':id')
  @ApiDataResponse(PostResponseDto)
  async getById(@Param('id') id: string) {
    return ok(PostResponseDto.from(await this.posts.getAdminById(id)));
  }

  @Post()
  @ApiDataResponse(PostResponseDto, { status: 201 })
  async create(@Body() dto: CreatePostDto) {
    return ok(PostResponseDto.from(await this.posts.create(dto)));
  }

  @Patch(':id')
  @ApiDataResponse(PostResponseDto)
  async update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return ok(PostResponseDto.from(await this.posts.update(id, dto)));
  }

  @Delete(':id')
  @ApiDataResponse(PostResponseDto)
  async remove(@Param('id') id: string) {
    return ok(PostResponseDto.from(await this.posts.remove(id)));
  }
}
