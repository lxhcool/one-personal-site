import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('lxhcool API')
    .setDescription('API documentation for the lxhcool frontend and admin applications.')
    .setVersion('1.0')
    .build();

  return SwaggerModule.createDocument(app, config);
}
