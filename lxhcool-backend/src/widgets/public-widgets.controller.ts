import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ok } from '../common/api-response';
import { ApiDataResponse } from '../common/openapi-response.decorator';
import { WidgetResponseDto } from './dto/widget-response.dto';
import { WidgetsService } from './widgets.service';

@Controller('public/widgets')
@ApiTags('Public Widgets')
export class PublicWidgetsController {
  constructor(private readonly widgets: WidgetsService) {}

  @Get()
  @ApiDataResponse(WidgetResponseDto, { isArray: true })
  async list() {
    return ok(WidgetResponseDto.fromMany(await this.widgets.listPublic()));
  }
}
