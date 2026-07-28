import { ApiProperty } from '@nestjs/swagger';
import { NeteaseMetadataResponseDto } from './netease-metadata-response.dto';

export class NeteasePlaylistTrackResponseDto extends NeteaseMetadataResponseDto {
  @ApiProperty()
  externalUrl!: string;

  @ApiProperty()
  embedUrl!: string;

  @ApiProperty()
  audioUrl!: string;
}
