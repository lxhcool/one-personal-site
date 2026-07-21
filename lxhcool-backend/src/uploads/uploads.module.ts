import { Module } from '@nestjs/common';
import { ImageThumbnailsService } from './image-thumbnails.service';
import { PublicImagesController } from './public-images.controller';
import { UploadsController } from './uploads.controller';

@Module({
  controllers: [UploadsController, PublicImagesController],
  providers: [ImageThumbnailsService],
})
export class UploadsModule {}
