import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() { 
  const PORT = process.env.PORT ? +process.env.PORT : 3001; 

  const app = await NestFactory.create(AdminModule);

  app.enableCors({
    origin: 'http://localhost:3000', 
    credentials: true, 
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  app.setGlobalPrefix('api'); 
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;

  await app.listen(port);
  console.log(`Admin module running on port ${port}`);  
}

bootstrap();