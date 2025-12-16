import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, Category, Report, Template, Designer } from './schemas/schemas';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(Template.name) private templateModel: Model<Template>, // mapped to 'designs'
    @InjectModel(Designer.name) private designerModel: Model<Designer>, // mapped to 'designerProfiles'
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalCategories, totalReports, totalTemplates] = await Promise.all([
      this.userModel.countDocuments(),
      this.categoryModel.countDocuments(),
      this.reportModel.countDocuments(),
      this.templateModel.countDocuments({ isDeleted: false }),
    ]);
    return { userCount: totalUsers, templateCount: totalTemplates, categoryCount: totalCategories };
  }

  async getTopTemplates(): Promise<{ title: string; viewCount: number; icon: string }[]> {
    const templates = await this.templateModel
      .find({ isDeleted: false })
      .sort({ viewCount: -1 })
      .limit(3)
      .select('title viewCount')
      .lean();
    return templates.map(t => ({
      title: t.title,
      viewCount: t.viewCount ?? 0,
      icon: 'shirt',
    }));
  }

  async getTopDesigners(): Promise<{ name: string; followerCount: number; icon: string }[]> {
    const designers = await this.designerModel
      .find()
      .sort({ followerCount: -1 })
      .limit(3)
      .select('name followerCount')
      .lean();

    return designers.map(d => ({
      name: d.name,
      followerCount: d.followerCount ?? 0,
      icon: 'user',
    }));
  }

  async getTopRankings() {
    const [templates, designers] = await Promise.all([this.getTopTemplates(), this.getTopDesigners()]);
    return {
      topTemplates: templates,
      topDesigners: designers.map(d => ({
        title: d.name,
        metric: `${d.followerCount} followers`,
        icon: 'user',
        bgColor: 'bg-gray-100',
      })),
    };
  }

  async getUsers(query: any) {
    const filter: any = {};
    if (query.name) filter.name = new RegExp(query.name, 'i');
    return this.userModel.find(filter).lean();
  }

  async getUserDetail(id: string) {
    return this.userModel.findById(id).lean();
  }

  async getCategories(query: any) {
    const filter: any = { isDeleted: false };
    if (query.name) filter.name = new RegExp(query.name, 'i');
    return this.categoryModel.find(filter).lean();
  }

  async createCategory(dto: { name: string; slug: string; styles: string[] }) {
    return new this.categoryModel({ ...dto, isDeleted: false }).save();
  }

  async updateCategory(id: string, dto: Partial<Category>) {
    return this.categoryModel.findByIdAndUpdate(id, dto, { new: true }).lean();
  }

  async deleteCategory(id: string) {
    return this.categoryModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean();
  }

  async getReports() {
    return this.reportModel
      .find()
      .populate('createdBy', 'name email')
      .populate('category', 'name slug')
      .lean();
  }

  async createReport(dto: { content: string; category: string; createdBy: string }) {
    return new this.reportModel({
      content: dto.content,
      category: new Types.ObjectId(dto.category),
      createdBy: new Types.ObjectId(dto.createdBy),
    }).save();
  }
}
