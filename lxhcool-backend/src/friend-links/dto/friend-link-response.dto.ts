import { ApiProperty } from '@nestjs/swagger';
import { FriendLink } from '@prisma/client';

export class FriendLinkResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'uri' })
  url!: string;

  @ApiProperty({ type: String, nullable: true })
  category!: string | null;

  @ApiProperty({ type: String, nullable: true })
  logo!: string | null;

  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty()
  sortOrder!: number;
  @ApiProperty()
  isVisible!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  static from(friendLink: FriendLink): FriendLinkResponseDto {
    return {
      ...friendLink,
      createdAt: friendLink.createdAt.toISOString(),
      updatedAt: friendLink.updatedAt.toISOString(),
    };
  }

  static fromMany(friendLinks: FriendLink[]): FriendLinkResponseDto[] {
    return friendLinks.map((friendLink) => this.from(friendLink));
  }
}
