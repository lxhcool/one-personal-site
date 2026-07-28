import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CategoryType } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ok } from '../common/api-response';
import { ApiDataResponse } from '../common/openapi-response.decorator';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('admin/categories')
@UseGuards(AdminAuthGuard)
@ApiTags('Admin Categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiDataResponse(CategoryResponseDto, { isArray: true })
  async list(@Query('type') type?: CategoryType) {
    return ok(CategoryResponseDto.fromMany(await this.categories.list(type)));
  }

  @Post()
  @ApiDataResponse(CategoryResponseDto, { status: 201 })
  async create(@Body() dto: CreateCategoryDto) {
    return ok(CategoryResponseDto.from(await this.categories.create(dto)));
  }

  @Patch(':id')
  @ApiDataResponse(CategoryResponseDto)
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return ok(CategoryResponseDto.from(await this.categories.update(id, dto)));
  }

  @Delete(':id')
  @ApiDataResponse(CategoryResponseDto)
  async remove(@Param('id') id: string) {
    return ok(CategoryResponseDto.from(await this.categories.remove(id)));
  }
}
