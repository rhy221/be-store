import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, Category, Report, Template, Designer, UnlockRequest } from './schemas/schemas';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
    @InjectModel(Template.name) private readonly templateModel: Model<Template>,
    @InjectModel(Designer.name) private readonly designerModel: Model<Designer>,
    @InjectModel(UnlockRequest.name) private readonly unlockRequestModel: Model<UnlockRequest>,
  ) {}

  async getDashboardStats() {
    const [userCount, categoryCount, templateCount] = await Promise.all([
      this.userModel.countDocuments(),
      this.categoryModel.countDocuments({ isDeleted: false }),
      this.templateModel.countDocuments({ isDeleted: false }),
    ]);
    return { userCount, categoryCount, templateCount };
  }

  async getUsers(query: any) {
    const filter: any = {};
    if (query.name) filter.name = new RegExp(query.name, 'i');
    return this.userModel.find(filter).lean();
  }

  async getUserDetail(id: string) {
    const user = await this.userModel.findById(id).lean();
    if (!user) throw new NotFoundException('User not found');
    let profile: any = null;
    if (user.role.includes('designer')) {
      profile = await this.designerModel.findOne({ userId: user._id }).lean();
    } else {
      profile = await this.userModel.findOne({ _id: user._id }).lean();
    }
    return { user, profile };
  }

  async getUserDesigns(userId: string) {
    const user = await this.userModel.findById(userId).lean()
    if (!user) throw new NotFoundException('User not found')

    if (!user.role.includes('designer')) return []

    return this.templateModel
      .find({ designerId: user._id, isDeleted: false })
      .lean()
  }


  async getCategories(query: any) {
    const filter: any = { isDeleted: false };
    if (query.name) filter.name = new RegExp(query.name, 'i');
    return this.categoryModel.find(filter).lean();
  }

  async getCategoryDetail(id: string) {
    const category = await this.categoryModel.findOne({ _id: id, isDeleted: false }).lean();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async getCategoryProducts(categoryId: string, search?: string) {
    const filter: any = { isDeleted: false, categoryId: new Types.ObjectId(categoryId) };
    if (search) filter.title = new RegExp(search, 'i');
    return this.templateModel.find(filter).select('title imageUrls createdAt').lean();
  }

  async createCategory(dto: { name: string; slug: string; styles: string[] }) {
    return this.categoryModel.create({ name: dto.name, slug: dto.slug, styles: dto.styles ?? [], isDeleted: false });
  }

  async updateCategory(id: string, dto: Partial<Category>) {
    const category = await this.categoryModel.findByIdAndUpdate(id, dto, { new: true }).lean();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async deleteCategory(id: string) {
    const category = await this.categoryModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async getReports() {
    return this.reportModel
      .find()
      .populate('createdBy', 'name email')
      .populate('category', 'name slug')
      .lean();
  }

  async createReport(dto: { content: string; category: string; createdBy: string }) {
    return this.reportModel.create({
      content: dto.content,
      category: new Types.ObjectId(dto.category),
      createdBy: new Types.ObjectId(dto.createdBy),
    });
  }

  async getTopTemplates() {
    return this.templateModel
      .find({ isDeleted: false })
      .sort({ viewCount: -1 })
      .limit(3)
      .select('title viewCount')
      .lean();
  }

  async getTopDesigners() {
    return this.designerModel
      .find()
      .sort({ followerCount: -1 })
      .limit(3)
      .select('name followerCount')
      .lean();
  }

  async getTopRankings() {
    const [topTemplates, topDesigners] = await Promise.all([this.getTopTemplates(), this.getTopDesigners()]);
    return { topTemplates, topDesigners };
  }

  async getProductStats() {
    const categories = await this.categoryModel.find({ isDeleted: false }).lean();
    const templates = await this.templateModel.find({ isDeleted: false }).lean();
    return categories.map(cat => ({
      categoryName: cat.name,
      quantity: templates.filter(t => t.categoryId?.toString() === cat._id.toString()).length,
    }));
  }

  async getRoleStats() {
    const designerCount = await this.userModel.countDocuments({ role: 'designer' });
    const customerCount = await this.userModel.countDocuments({ role: { $ne: 'designer' } });
    return { designerCount, customerCount };
  }

  async getUnlockRequests() {
    return this.unlockRequestModel.find().lean();
  }

  async updateUserState(id: string, state: 'active' | 'blocked') {
  return this.userModel.findByIdAndUpdate(
    id,
    { state },
    { new: true },
  );
}

}
