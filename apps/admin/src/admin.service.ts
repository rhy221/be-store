import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, Category, Report } from './schemas/schemas';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
  ) {}

  /* ================= DASHBOARD ================= */

  async getDashboardStats() {
    const totalUsers = await this.userModel.countDocuments();
    const totalCategories = await this.categoryModel.countDocuments();
    const totalReports = await this.reportModel.countDocuments();

    return {
      totalUsers,
      totalCategories,
      totalReports,
    };
  }

  /* ================= USERS ================= */

  async getUsers(query: any) {
    const filter: any = {};
    if (query.name) {
      filter.name = new RegExp(query.name, 'i');
    }

    return this.userModel.find(filter);
  }

  async getUserDetail(id: string) {
    return this.userModel.findById(id);
  }

  /* ================= CATEGORIES ================= */

  async getCategories(query: any) {
    const filter: any = { isDeleted: false };

    if (query.name) {
      filter.name = new RegExp(query.name, 'i');
    }

    return this.categoryModel.find(filter);
  }

  async createCategory(dto: {
    name: string;
    slug: string;
    styles: string[];
  }) {
    return new this.categoryModel({
      ...dto,
      isDeleted: false,
    }).save();
  }

  async updateCategory(id: string, dto: Partial<Category>) {
    return this.categoryModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async deleteCategory(id: string) {
    return this.categoryModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
  }

  /* ================= REPORTS ================= */

  async getReports() {
    return this.reportModel
      .find()
      .populate('createdBy', 'name email')
      .populate('category', 'name slug');
  }

  async createReport(dto: {
    content: string;
    category: string;
    createdBy: string;
  }) {
    return new this.reportModel({
      content: dto.content,
      category: new Types.ObjectId(dto.category),
      createdBy: new Types.ObjectId(dto.createdBy),
    }).save();
  }
}
