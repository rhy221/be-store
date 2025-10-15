import { NestFactory } from '@nestjs/core';
import { CustomerModule } from './customer.module';

async function bootstrap() {
  const app = await NestFactory.create(CustomerModule);
  await app.listen(process.env.port ?? 3002);
}
bootstrap();
