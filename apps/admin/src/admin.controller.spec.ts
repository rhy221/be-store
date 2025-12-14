import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockService = {
    getDashboardStats: jest.fn().mockResolvedValue({
      totalUsers: 10,
      totalTemplates: 5,
      totalCategories: 3,
      topViewed: [],
      topRevenue: [],
    }),
    getTemplatesPerWeek: jest.fn().mockResolvedValue([]),
    getUsersDaily: jest.fn().mockResolvedValue([]),
    getReports: jest.fn().mockResolvedValue([]),
    getUsers: jest.fn().mockResolvedValue([]),
    getUserDetail: jest.fn().mockResolvedValue({}),
    blockUserAccount: jest.fn().mockResolvedValue({}),
    unlockUser: jest.fn().mockResolvedValue({}),
    getCategories: jest.fn().mockResolvedValue([]),
    createCategory: jest.fn().mockResolvedValue({}),
    updateCategory: jest.fn().mockResolvedValue({}),
    deleteCategory: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: mockService }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getDashboardStats should return stats', async () => {
    const res = await controller.getDashboardStats();
    expect(res).toEqual({
      totalUsers: 10,
      totalTemplates: 5,
      totalCategories: 3,
      topViewed: [],
      topRevenue: [],
    });
    expect(service.getDashboardStats).toHaveBeenCalled();
  });

  it('getReports calls service', async () => {
    const r = await controller.getReports({});
    expect(r).toEqual([]);
    expect(service.getReports).toHaveBeenCalled();
  });

  it('getUsers calls service', async () => {
    const r = await controller.getUsers({});
    expect(r).toEqual([]);
    expect(service.getUsers).toHaveBeenCalled();
  });
});
