import { Module } from '@nestjs/common';
import { DesignerController } from './designer.controller';
import { DesignerService } from './designer.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
            MongooseModule.forRootAsync({
              imports: [ConfigModule],
              inject: [ConfigService],
              useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('MONGO_URI'),
              }),
            }),
    AuthModule
  ],
  controllers: [DesignerController],
  providers: [DesignerService],
})
export class DesignerModule {}
