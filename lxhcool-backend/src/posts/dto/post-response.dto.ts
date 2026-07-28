import { InternalServerErrorException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Post, PostType, PublishStatus } from '@prisma/client';

export class PostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: PostType })
  type!: PostType;

  @ApiProperty()
  title!: string;
  @ApiProperty()
  slug!: string;

  @ApiProperty({ type: String, nullable: true })
  category!: string | null;

  @ApiProperty({ type: String, nullable: true })
  excerpt!: string | null;

  @ApiProperty()
  content!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  media!: Record<string, unknown>;

  @ApiProperty({ type: String, nullable: true })
  coverImage!: string | null;

  @ApiProperty({ enum: PublishStatus })
  status!: PublishStatus;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: string | null;

  @ApiProperty({ type: String, nullable: true })
  seoTitle!: string | null;

  @ApiProperty({ type: String, nullable: true })
  seoDescription!: string | null;

  @ApiProperty({ type: String, nullable: true })
  ogImage!: string | null;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  static from(post: Post): PostResponseDto {
    return {
      id: post.id,
      type: post.type,
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt,
      content: post.content,
      media: this.requireMediaObject(post.media),
      coverImage: post.coverImage,
      status: post.status,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      ogImage: post.ogImage,
      tags: post.tags,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  static fromMany(posts: Post[]): PostResponseDto[] {
    return posts.map((post) => this.from(post));
  }

  private static requireMediaObject(value: Post['media']): Record<string, unknown> {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      throw new InternalServerErrorException('Post media must be a JSON object');
    }

    return value as Record<string, unknown>;
  }
}
