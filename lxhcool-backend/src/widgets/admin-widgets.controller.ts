import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ok } from '../common/api-response';
import { ApiDataResponse } from '../common/openapi-response.decorator';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { WidgetResponseDto } from './dto/widget-response.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { WidgetsService } from './widgets.service';

@Controller('admin/widgets')
@UseGuards(AdminAuthGuard)
@ApiTags('Admin Widgets')
export class AdminWidgetsController {
  constructor(private readonly widgets: WidgetsService) {}

  @Get()
  @ApiDataResponse(WidgetResponseDto, { isArray: true })
  async list() {
    return ok(WidgetResponseDto.fromMany(await this.widgets.listAdmin()));
  }

  @Post()
  @ApiDataResponse(WidgetResponseDto, { status: 201 })
  async create(@Body() dto: CreateWidgetDto) {
    return ok(WidgetResponseDto.from(await this.widgets.create(dto)));
  }

  @Patch(':id')
  @ApiDataResponse(WidgetResponseDto)
  async update(@Param('id') id: string, @Body() dto: UpdateWidgetDto) {
    return ok(WidgetResponseDto.from(await this.widgets.update(id, dto)));
  }

  @Delete(':id')
  @ApiDataResponse(WidgetResponseDto)
  async remove(@Param('id') id: string) {
    return ok(WidgetResponseDto.from(await this.widgets.remove(id)));
  }
}
