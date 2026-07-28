import {
  BadRequestException,
  Controller,
  applyDecorators,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ok } from '../common/api-response';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ApiDataResponse } from '../common/openapi-response.decorator';
import { UploadResponseDto } from './dto/upload-response.dto';

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const audioMimeTypes = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
]);
const videoMimeTypes = new Set(['video/mp4', 'video/webm', 'video/ogg']);

function ApiSingleFileUpload() {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
  );
}

@Controller('admin/uploads')
@UseGuards(AdminAuthGuard)
@ApiTags('Uploads')
export class UploadsController {
  @Post('images')
  @ApiSingleFileUpload()
  @ApiDataResponse(UploadResponseDto, { status: 201 })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'images'),
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        callback(null, imageMimeTypes.has(file.mimetype));
      },
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    }),
  )
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please upload a JPG, PNG, WebP, or GIF image under 20MB');
    }

    return ok<UploadResponseDto>({
      url: `/uploads/images/${file.filename}`,
    });
  }

  @Post('audio')
  @ApiSingleFileUpload()
  @ApiDataResponse(UploadResponseDto, { status: 201 })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'audio'),
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        callback(null, audioMimeTypes.has(file.mimetype));
      },
      limits: {
        fileSize: 30 * 1024 * 1024,
      },
    }),
  )
  uploadAudio(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please upload an MP3, M4A, WAV, OGG, or WebM audio file under 30MB');
    }

    return ok<UploadResponseDto>({
      url: `/uploads/audio/${file.filename}`,
    });
  }

  @Post('videos')
  @ApiSingleFileUpload()
  @ApiDataResponse(UploadResponseDto, { status: 201 })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'videos'),
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        callback(null, videoMimeTypes.has(file.mimetype));
      },
      limits: {
        fileSize: 300 * 1024 * 1024,
      },
    }),
  )
  uploadVideo(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please upload an MP4, WebM, or OGG video file under 300MB');
    }

    return ok<UploadResponseDto>({
      url: `/uploads/videos/${file.filename}`,
    });
  }
}
