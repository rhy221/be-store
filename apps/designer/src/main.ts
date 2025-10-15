import { NestFactory } from '@nestjs/core';
import { DesignerModule } from './designer.module';

async function bootstrap() {
  const app = await NestFactory.create(DesignerModule);
  await app.listen(process.env.port ?? 3003);
}
bootstrap();
