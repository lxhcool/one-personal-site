import { IsBoolean, IsIn, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateWidgetDto {
  @IsIn(['LEFT', 'RIGHT'])
  area!: 'LEFT' | 'RIGHT';

  @IsIn(['MUSIC_PLAYER', 'HITOKOTO', 'FRIEND_LINKS', 'PROFILE', 'DATE_CARD', 'PHOTO_GALLERY'])
  type!: 'MUSIC_PLAYER' | 'HITOKOTO' | 'FRIEND_LINKS' | 'PROFILE' | 'DATE_CARD' | 'PHOTO_GALLERY';

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
