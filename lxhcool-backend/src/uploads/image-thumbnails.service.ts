import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import type { Sharp, SharpOptions } from 'sharp';

const createSharp = require('sharp') as (input: string, options?: SharpOptions) => Sharp;

type ThumbnailOptions = {
  width: number;
  height?: number;
  fit: 'cover' | 'inside';
};

const supportedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const safeFilenamePattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

@Injectable()
export class ImageThumbnailsService {
  private readonly imageDirectory = join(process.cwd(), 'uploads', 'images');
  private readonly thumbnailDirectory = join(process.cwd(), 'uploads', 'thumbnails');
  private readonly pending = new Map<string, Promise<string>>();

  constructor() {
    mkdirSync(this.thumbnailDirectory, { recursive: true });
  }

  async getThumbnail(filename: string, options: ThumbnailOptions) {
    const safeFilename = basename(filename);
    const extension = extname(safeFilename).toLowerCase();
    if (safeFilename !== filename || !safeFilenamePattern.test(safeFilename) || !supportedImageExtensions.has(extension)) {
      throw new BadRequestException('Invalid image filename');
    }

    const sourcePath = join(this.imageDirectory, safeFilename);
    const cacheName = `${safeFilename}--${options.width}x${options.height ?? 0}-${options.fit}.webp`;
    const cachePath = join(this.thumbnailDirectory, cacheName);

    let sourceStat;
    try {
      sourceStat = await stat(sourcePath);
    } catch {
      throw new NotFoundException('Image not found');
    }

    try {
      const cacheStat = await stat(cachePath);
      if (cacheStat.mtimeMs >= sourceStat.mtimeMs) return cachePath;
    } catch {
      // Generate the missing thumbnail below.
    }

    const pendingThumbnail = this.pending.get(cachePath);
    if (pendingThumbnail) return pendingThumbnail;

    const generation = createSharp(sourcePath, { animated: false })
      .rotate()
      .resize({
        width: options.width,
        height: options.height,
        fit: options.fit,
        withoutEnlargement: true,
      })
      .webp({ quality: 78, effort: 4 })
      .toFile(cachePath)
      .then(() => cachePath)
      .finally(() => this.pending.delete(cachePath));

    this.pending.set(cachePath, generation);
    return generation;
  }
}
