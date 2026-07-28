import { ApiProperty } from '@nestjs/swagger';

export class NeteaseMetadataResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  artist!: string;

  @ApiProperty()
  cover!: string;

  @ApiProperty()
  duration!: number;
}
