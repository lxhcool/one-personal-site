import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ok } from '../common/api-response';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { WidgetsService } from './widgets.service';

@Controller()
export class WidgetsController {
  constructor(private readonly widgets: WidgetsService) {}

  @Get('public/widgets')
  async listPublic() {
    return ok(await this.widgets.listPublic());
  }

  @Get('admin/widgets')
  @UseGuards(AdminAuthGuard)
  async listAdmin() {
    return ok(await this.widgets.listAdmin());
  }

  @Post('admin/widgets')
  @UseGuards(AdminAuthGuard)
  async create(@Body() dto: CreateWidgetDto) {
    return ok(await this.widgets.create(dto));
  }

  @Patch('admin/widgets/:id')
  @UseGuards(AdminAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateWidgetDto) {
    return ok(await this.widgets.update(id, dto));
  }

  @Delete('admin/widgets/:id')
  @UseGuards(AdminAuthGuard)
  async remove(@Param('id') id: string) {
    return ok(await this.widgets.remove(id));
  }
}
