import { IsBoolean, IsIn, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WidgetArea, WidgetType, WidgetVerticalPosition } from '@prisma/client';

export class CreateWidgetDto {
  @ApiProperty({ enum: WidgetArea })
  @IsIn(['LEFT', 'RIGHT'])
  area!: 'LEFT' | 'RIGHT';

  @ApiPropertyOptional({ enum: WidgetVerticalPosition })
  @IsOptional()
  @IsIn(['TOP', 'BOTTOM'])
  verticalPosition?: 'TOP' | 'BOTTOM';

  @ApiPropertyOptional({ minimum: -1000, maximum: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(-1000)
  @Max(3000)
  horizontalOffset?: number;

  @ApiPropertyOptional({ minimum: -1000, maximum: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(-1000)
  @Max(3000)
  verticalOffset?: number;

  @ApiPropertyOptional({ minimum: -45, maximum: 45 })
  @IsOptional()
  @IsNumber()
  @Min(-45)
  @Max(45)
  rotation?: number;

  @ApiProperty({ enum: WidgetType })
  @IsIn(['MUSIC_PLAYER', 'HITOKOTO', 'FRIEND_LINKS', 'DATE_CARD', 'PHOTO_GALLERY', 'PROJECT_TREE', 'KEYBOARD'])
  type!: 'MUSIC_PLAYER' | 'HITOKOTO' | 'FRIEND_LINKS' | 'DATE_CARD' | 'PHOTO_GALLERY' | 'PROJECT_TREE' | 'KEYBOARD';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
