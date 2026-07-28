import { InternalServerErrorException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  SiteWidget as PrismaSiteWidget,
  WidgetArea,
  WidgetType,
  WidgetVerticalPosition,
} from '@prisma/client';

export class WidgetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: WidgetArea })
  area!: WidgetArea;

  @ApiProperty({ enum: WidgetVerticalPosition })
  verticalPosition!: WidgetVerticalPosition;

  @ApiProperty()
  horizontalOffset!: number;
  @ApiProperty()
  verticalOffset!: number;
  @ApiProperty()
  rotation!: number;

  @ApiProperty({ enum: WidgetType })
  type!: WidgetType;

  @ApiProperty({ type: String, nullable: true })
  title!: string | null;

  @ApiProperty()
  enabled!: boolean;
  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ type: 'object', additionalProperties: true })
  config!: Record<string, unknown>;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  static from(widget: PrismaSiteWidget): WidgetResponseDto {
    return {
      ...widget,
      config: this.requireConfigObject(widget.config),
      createdAt: widget.createdAt.toISOString(),
      updatedAt: widget.updatedAt.toISOString(),
    };
  }

  static fromMany(widgets: PrismaSiteWidget[]): WidgetResponseDto[] {
    return widgets.map((widget) => this.from(widget));
  }

  private static requireConfigObject(value: PrismaSiteWidget['config']): Record<string, unknown> {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      throw new InternalServerErrorException('Widget config must be a JSON object');
    }

    return value as Record<string, unknown>;
  }
}
