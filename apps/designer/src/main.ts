import { NestFactory } from '@nestjs/core';
import { DesignerModule } from './designer.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(DesignerModule, {cors: true});
  app.enableCors({
    origin: ['http://localhost:3000'], 
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true
  }));

  // app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(3003);
}
bootstrap();
