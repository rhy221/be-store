import { NestFactory } from '@nestjs/core';
import { DesignerModule } from './designer.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(DesignerModule, {cors: true});
  app.useGlobalPipes(new ValidationPipe({transform: true}));
  await app.listen(3003);
}
bootstrap();
