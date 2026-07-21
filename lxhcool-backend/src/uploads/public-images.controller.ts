import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ImageThumbnailsService } from './image-thumbnails.service';
import { ThumbnailQueryDto } from './thumbnail-query.dto';

@Controller('public/media/images')
export class PublicImagesController {
  constructor(private readonly thumbnails: ImageThumbnailsService) {}

  @Get(':filename/thumbnail')
  async getThumbnail(
    @Param('filename') filename: string,
    @Query() query: ThumbnailQueryDto,
    @Res() response: Response,
  ) {
    const thumbnailPath = await this.thumbnails.getThumbnail(filename, query);
    response.setHeader('Content-Type', 'image/webp');
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.sendFile(thumbnailPath);
  }
}
