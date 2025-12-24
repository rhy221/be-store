import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() { 
  const PORT = process.env.PORT ? +process.env.PORT : 3001; 

  const app = await NestFactory.create(AdminModule);

  app.enableCors({
    origin: 'http://localhost:3000', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
    credentials: true, 
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  app.setGlobalPrefix('api'); 
  await app.listen(PORT);
  console.log(`Admin module running on port ${PORT}`);  
}

bootstrap();