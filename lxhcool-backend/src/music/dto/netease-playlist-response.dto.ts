import { ApiProperty } from '@nestjs/swagger';
import { NeteasePlaylistTrackResponseDto } from './netease-playlist-track-response.dto';

export class NeteasePlaylistResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  cover!: string;

  @ApiProperty()
  trackCount!: number;

  @ApiProperty({ type: [NeteasePlaylistTrackResponseDto] })
  tracks!: NeteasePlaylistTrackResponseDto[];
}
