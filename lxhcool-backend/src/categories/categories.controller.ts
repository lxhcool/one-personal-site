import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CategoryType } from '@prisma/client';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ok } from '../common/api-response';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('admin/categories')
@UseGuards(AdminAuthGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  async list(@Query('type') type?: CategoryType) {
    return ok(await this.categories.list(type));
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return ok(await this.categories.create(dto));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return ok(await this.categories.update(id, dto));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return ok(await this.categories.remove(id));
  }
}
