import { ApiProperty } from '@nestjs/swagger';
import { CategoryType, ContentCategory } from '@prisma/client';

export class CategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: CategoryType })
  type!: CategoryType;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  logo!: string | null;

  @ApiProperty({ type: String, nullable: true })
  backgroundImage!: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  static from(category: ContentCategory): CategoryResponseDto {
    return {
      ...category,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  static fromMany(categories: ContentCategory[]): CategoryResponseDto[] {
    return categories.map((category) => this.from(category));
  }
}
