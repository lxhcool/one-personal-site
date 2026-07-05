import { IsBoolean, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateFriendLinkDto {
  @IsString()
  name!: string;

  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
