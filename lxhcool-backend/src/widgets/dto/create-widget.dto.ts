import { IsBoolean, IsIn, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateWidgetDto {
  @IsIn(['LEFT', 'RIGHT'])
  area!: 'LEFT' | 'RIGHT';

  @IsOptional()
  @IsIn(['TOP', 'BOTTOM'])
  verticalPosition?: 'TOP' | 'BOTTOM';

  @IsOptional()
  @IsNumber()
  @Min(-1000)
  @Max(3000)
  horizontalOffset?: number;

  @IsOptional()
  @IsNumber()
  @Min(-1000)
  @Max(3000)
  verticalOffset?: number;

  @IsOptional()
  @IsNumber()
  @Min(-45)
  @Max(45)
  rotation?: number;

  @IsIn(['MUSIC_PLAYER', 'HITOKOTO', 'FRIEND_LINKS', 'DATE_CARD', 'PHOTO_GALLERY', 'PROJECT_TREE', 'KEYBOARD'])
  type!: 'MUSIC_PLAYER' | 'HITOKOTO' | 'FRIEND_LINKS' | 'DATE_CARD' | 'PHOTO_GALLERY' | 'PROJECT_TREE' | 'KEYBOARD';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
