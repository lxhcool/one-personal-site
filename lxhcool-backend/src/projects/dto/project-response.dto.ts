import { ApiProperty } from '@nestjs/swagger';
import { Project, PublishStatus } from '@prisma/client';

export class ProjectResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  title!: string;
  @ApiProperty()
  slug!: string;

  @ApiProperty({ type: String, nullable: true })
  excerpt!: string | null;

  @ApiProperty({ type: String, nullable: true })
  content!: string | null;

  @ApiProperty({ type: String, nullable: true })
  coverImage!: string | null;

  @ApiProperty({ type: [String] })
  gallery!: string[];

  @ApiProperty({ type: [String] })
  techStack!: string[];

  @ApiProperty({ type: String, nullable: true })
  liveUrl!: string | null;

  @ApiProperty({ type: String, nullable: true })
  githubUrl!: string | null;

  @ApiProperty()
  featured!: boolean;
  @ApiProperty()
  sortOrder!: number;

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

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  static from(project: Project): ProjectResponseDto {
    return {
      ...project,
      publishedAt: project.publishedAt?.toISOString() ?? null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  static fromMany(projects: Project[]): ProjectResponseDto[] {
    return projects.map((project) => this.from(project));
  }
}
