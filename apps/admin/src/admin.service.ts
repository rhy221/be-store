import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, Template, Category, Report } from './schemas/schemas';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Template.name) private templateModel: Model<Template>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.userModel.countDocuments();
    const totalTemplates = await this.templateModel.countDocuments();
    const totalCategories = await this.categoryModel.countDocuments();

    const topViewed = await this.templateModel
      .find()
      .sort({ views: -1 })
      .limit(3);

    const topRevenue = await this.templateModel
      .find()
      .sort({ revenue: -1 })
      .limit(3);

    return { totalUsers, totalTemplates, totalCategories, topViewed, topRevenue };
  }

  async getTemplatesPerWeek() {
    return this.templateModel.aggregate([
      {
        $group: {
          _id: { week: { $week: '$createdAt' } },
          total: { $sum: 1 },
        },
      },
      { $sort: { '_id.week': 1 } },
    ]);
  }

  async getUsersDaily() {
    return this.userModel.aggregate([
      {
        $group: {
          _id: { day: { $dayOfMonth: '$createdAt' } },
          total: { $sum: 1 },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]);
  }

  async getReports(query: any) {
    const filter: any = {};
    if (query.type) filter.type = query.type;
    if (query.username) filter.username = query.username;
    return this.reportModel.find(filter);
  }

  async rejectReport(id: string) {
    return this.reportModel.findByIdAndUpdate(id, { status: 'rejected' });
  }

  async warnUser(userId: string) {
    return this.userModel.findByIdAndUpdate(userId, { warnings: 1 });
  }

  async blockUser(userId: string) {
    return this.userModel.findByIdAndUpdate(userId, { status: 'blocked' });
  }

  async getUsers(query: any) {
    const filter: any = {};
    if (query.name) filter.name = new RegExp(query.name, 'i');
    if (query.status) filter.status = query.status;

    return this.userModel.find(filter);
  }

  async getUserDetail(id: string) {
    return this.userModel.findById(id).populate('templates');
  }

  async blockUserAccount(id: string) {
    return this.userModel.findByIdAndUpdate(id, { status: 'blocked' });
  }

  async unlockUser(id: string) {
    return this.userModel.findByIdAndUpdate(id, { status: 'active' });
  }

  async getCategories(query: any) {
    const filter: any = {};
    if (query.name) filter.name = new RegExp(query.name, 'i');
    return this.categoryModel.find(filter).populate('templates');
  }

  async createCategory(dto: any) {
    return new this.categoryModel(dto).save();
  }

  async updateCategory(id: string, dto: any) {
    return this.categoryModel.findByIdAndUpdate(id, dto);
  }

  async deleteCategory(id: string) {
    return this.categoryModel.findByIdAndDelete(id);
  }
}
