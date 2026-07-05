import { Module } from '@nestjs/common';
import { MusicController, PublicMusicController } from './music.controller';

@Module({
  controllers: [MusicController, PublicMusicController],
})
export class MusicModule {}
