import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { requireEnv, requirePort } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const uploadDir = join(process.cwd(), 'uploads');
  const imageUploadDir = join(uploadDir, 'images');
  const audioUploadDir = join(uploadDir, 'audio');
  const videoUploadDir = join(uploadDir, 'videos');
  const frontendOrigins = [
    ...requireEnv('FRONTEND_ORIGIN').split(',').map((origin) => origin.trim()).filter(Boolean),
  ];

  mkdirSync(imageUploadDir, { recursive: true });
  mkdirSync(audioUploadDir, { recursive: true });
  mkdirSync(videoUploadDir, { recursive: true });
  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
  });
  app.use('/uploads', express.static(uploadDir));
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('lxhcool API')
    .setDescription('API documentation for the lxhcool frontend and admin applications.')
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, swaggerDocument);

  const port = requirePort();
  await app.listen(port);
}

bootstrap();
