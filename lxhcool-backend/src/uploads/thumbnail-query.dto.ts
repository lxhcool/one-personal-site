import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

const thumbnailSizes = [96, 160, 240, 320, 480, 720, 960, 1280] as const;

export class ThumbnailQueryDto {
  @Transform(({ value }) => (value === undefined ? 320 : Number(value)))
  @IsIn(thumbnailSizes)
  width = 320;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsIn(thumbnailSizes)
  height?: number;

  @IsOptional()
  @IsIn(['cover', 'inside'])
  fit: 'cover' | 'inside' = 'inside';
}
