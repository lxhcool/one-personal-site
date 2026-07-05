import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ok } from '../common/api-response';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller()
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get('public/projects')
  async listPublic(@Query('featured') featured?: string) {
    return ok(await this.projects.listPublic(featured));
  }

  @Get('public/projects/:slug')
  async getPublic(@Param('slug') slug: string) {
    return ok(await this.projects.getPublicBySlug(slug));
  }

  @Get('admin/projects')
  @UseGuards(AdminAuthGuard)
  async listAdmin() {
    return ok(await this.projects.listAdmin());
  }

  @Get('admin/projects/:id')
  @UseGuards(AdminAuthGuard)
  async getAdmin(@Param('id') id: string) {
    return ok(await this.projects.getAdminById(id));
  }

  @Post('admin/projects')
  @UseGuards(AdminAuthGuard)
  async create(@Body() dto: CreateProjectDto) {
    return ok(await this.projects.create(dto));
  }

  @Patch('admin/projects/:id')
  @UseGuards(AdminAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return ok(await this.projects.update(id, dto));
  }

  @Delete('admin/projects/:id')
  @UseGuards(AdminAuthGuard)
  async remove(@Param('id') id: string) {
    return ok(await this.projects.remove(id));
  }
}
