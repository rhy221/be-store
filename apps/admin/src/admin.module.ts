import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import { User, UserSchema, Template, TemplateSchema, Category, CategorySchema, Report, ReportSchema } from './schemas/schemas';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/be-store'),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Report.name, schema: ReportSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
