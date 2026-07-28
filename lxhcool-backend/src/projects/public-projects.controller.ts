import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ok } from '../common/api-response';
import { ApiDataResponse } from '../common/openapi-response.decorator';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectsService } from './projects.service';

@Controller('public/projects')
@ApiTags('Public Projects')
export class PublicProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiDataResponse(ProjectResponseDto, { isArray: true })
  async list(@Query('featured') featured?: string) {
    return ok(ProjectResponseDto.fromMany(await this.projects.listPublic(featured)));
  }

  @Get(':slug')
  @ApiDataResponse(ProjectResponseDto)
  async getBySlug(@Param('slug') slug: string) {
    return ok(ProjectResponseDto.from(await this.projects.getPublicBySlug(slug)));
  }
}
