import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { ResponseInterceptor } from './common/response.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const localStoragePath = resolve(
    process.cwd(),
    process.env.LOCAL_STORAGE_PATH ?? './uploads',
  );
  app.useStaticAssets(resolve(localStoragePath, 'public'), {
    prefix: '/uploads/',
  });
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1');
  app.use(helmet());
  app.enableCors({ origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  const config = new DocumentBuilder().setTitle('Tripi API').setDescription('Tripi bilingual group-travel marketplace API').setVersion('1.0').addBearerAuth().build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  await app.listen(Number(process.env.PORT ?? 4000));
}
void bootstrap();
