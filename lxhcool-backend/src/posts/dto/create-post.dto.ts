import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  @IsIn(['ARTICLE', 'MOMENT'])
  type?: 'ARTICLE' | 'MOMENT';

  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsObject()
  media?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'HIDDEN'])
  status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
