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
  Template,
  TemplateSchema,
  Designer,
  DesignerSchema,
  UnlockRequest,     
  UnlockRequestSchema,
  BanLog,
  BanLogSchema,
  AdminProfile,
  AdminProfileSchema,
} from './schemas/schemas';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AdminProfile.name, schema: AdminProfileSchema},
      { name: Category.name, schema: CategorySchema },
      { name: Report.name, schema: ReportSchema },
      { name: Template.name, schema: TemplateSchema, collection: 'designs' },
      { name: Designer.name, schema: DesignerSchema, collection: 'designerProfiles' },
      { name: UnlockRequest.name, schema: UnlockRequestSchema },
      { name: BanLog.name, schema: BanLogSchema },
      

    ]),
    CommonModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
