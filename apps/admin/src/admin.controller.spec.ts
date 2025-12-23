import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import {
  User,
  UserSchema,
  Category,
  CategorySchema,
  Report,
  ReportSchema,
} from './schemas/schemas';

describe('AdminController (Integration)', () => {
  let controller: AdminController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),

        MongooseModule.forRoot(process.env.MONGO_URI!),

        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
          { name: Category.name, schema: CategorySchema },
          { name: Report.name, schema: ReportSchema },
        ]),
      ],
      controllers: [AdminController],
      providers: [AdminService],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('controller should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getDashboardStats returns data', async () => {
    const res = await controller.getDashboardStats();

    expect(res).toHaveProperty('totalUsers');
    expect(res).toHaveProperty('totalCategories');
    expect(res).toHaveProperty('totalReports');
  });

  it('getCategories returns array', async () => {
    const res = await controller.getCategories({});

    expect(Array.isArray(res)).toBe(true);
  });

  it('createCategory works', async () => {
    const dto = {
      name: 'Test Category',
      slug: 'test-category',
      styles: ['A', 'B'],
    };

    const created = await controller.createCategory(dto);

    expect(created).toHaveProperty('_id');
    expect(created.name).toBe(dto.name);
  });

  it('getReports returns array', async () => {
    const res = await controller.getReports();

    expect(Array.isArray(res)).toBe(true);
  });
});
