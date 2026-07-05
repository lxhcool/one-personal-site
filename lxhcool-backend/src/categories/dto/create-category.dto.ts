import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsIn(['POST', 'FRIEND_LINK'])
  type!: 'POST' | 'FRIEND_LINK';

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
