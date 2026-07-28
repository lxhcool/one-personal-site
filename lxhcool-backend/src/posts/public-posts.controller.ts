import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ok } from '../common/api-response';
import { ApiDataResponse } from '../common/openapi-response.decorator';
import { PostResponseDto } from './dto/post-response.dto';
import { PostsService } from './posts.service';

@Controller('public/posts')
@ApiTags('Public Posts')
export class PublicPostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  @ApiDataResponse(PostResponseDto, { isArray: true })
  async list(@Query('type') type?: 'ARTICLE' | 'MOMENT') {
    return ok(PostResponseDto.fromMany(await this.posts.listPublic(type)));
  }

  @Get(':slug')
  @ApiDataResponse(PostResponseDto)
  async getBySlug(@Param('slug') slug: string) {
    return ok(PostResponseDto.from(await this.posts.getPublicBySlug(slug)));
  }
}
