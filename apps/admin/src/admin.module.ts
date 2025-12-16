import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from '@app/database';

import {
  User,
  UserSchema,
  Category,
  CategorySchema,
  Report,
  ReportSchema,
} from './schemas/schemas';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    DatabaseModule,

    MongooseModule.forRoot(process.env.MONGO_URI!),

    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Report.name, schema: ReportSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
