import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ok } from '../common/api-response';
import { ApiDataResponse } from '../common/openapi-response.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('admin/projects')
@UseGuards(AdminAuthGuard)
@ApiTags('Admin Projects')
export class AdminProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiDataResponse(ProjectResponseDto, { isArray: true })
  async list() {
    return ok(ProjectResponseDto.fromMany(await this.projects.listAdmin()));
  }

  @Get(':id')
  @ApiDataResponse(ProjectResponseDto)
  async getById(@Param('id') id: string) {
    return ok(ProjectResponseDto.from(await this.projects.getAdminById(id)));
  }

  @Post()
  @ApiDataResponse(ProjectResponseDto, { status: 201 })
  async create(@Body() dto: CreateProjectDto) {
    return ok(ProjectResponseDto.from(await this.projects.create(dto)));
  }

  @Patch(':id')
  @ApiDataResponse(ProjectResponseDto)
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return ok(ProjectResponseDto.from(await this.projects.update(id, dto)));
  }

  @Delete(':id')
  @ApiDataResponse(ProjectResponseDto)
  async remove(@Param('id') id: string) {
    return ok(ProjectResponseDto.from(await this.projects.remove(id)));
  }
}
