import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as jwt from 'jsonwebtoken'
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { User, Category, Report, Template, Designer, UnlockRequest, BanLog, AdminProfile } from './schemas/schemas';
import { ForgotPasswordDto, LoginDto, ResetPasswordDto } from './admin.dto';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AdminService {

  private transporter: nodemailer.Transporter;
    
        
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(AdminProfile.name) private readonly adminModel: Model<AdminProfile>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
    @InjectModel(Template.name) private readonly templateModel: Model<Template>,
    @InjectModel(Designer.name) private readonly designerModel: Model<Designer>,
    @InjectModel(UnlockRequest.name) private readonly unlockRequestModel: Model<UnlockRequest>,
      @InjectModel(BanLog.name) private readonly banLogModel: Model<BanLog>,
      private readonly configService: ConfigService

  ) {
    this.transporter = nodemailer.createTransport({
                host: 'sandbox.smtp.mailtrap.io',
                port: 2525,
                auth: {
                    user: configService.get<string>('MAIL_USER'),
                    pass: configService.get<string>('MAIL_PASS')
                }
            });
  }



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

  async getCategoryProducts(categoryId: string, param: any) {
    const {search, style} = param;
    const filter: any = { isDeleted: false, categoryId: new Types.ObjectId(categoryId) };
    if (search) filter.title = new RegExp(search, 'i');
    if(style) filter.style = style;
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
    return this.unlockRequestModel
      .find()
      .populate('userId', 'email name state') 
      .sort({ createdAt: -1 }) 
      .exec();
  }

  async createUnlockRequest(userId: string): Promise<UnlockRequest> {
    const newRequest = new this.unlockRequestModel({
      userId: new Types.ObjectId(userId),
    });
    
    return newRequest.save();
  }

//   async updateUserState(id: string, state: 'active' | 'banned') {
//   return this.userModel.findByIdAndUpdate(
//     id,
//     { state },
//     { new: true },
//   );
// }

 async updateUserState(id: string, dto: { state: 'active' | 'banned', reason: string }) {
  // 1. Cập nhật User
  const user = await this.userModel.findByIdAndUpdate(
    id, 
    { state: dto.state }, 
    { new: true }
  );

  if(!user) throw new NotFoundException("User not found");

  // 2. Tạo BanLog
  await new this.banLogModel({
    targetUserId: id,
    // actorId: adminId,
    action: dto.state === 'banned' ? 'ban' : 'unban',
    reason: dto.reason
  }).save();

  return user;
}

async login(dto: LoginDto) {
  const user = await this.userModel.findOne({email: dto.email});
        if(user != null) {
            const isTheSame = await bcrypt.compare(dto.password, user.password)
            
            if(isTheSame) {
                const token = this.createJwt(user);
                const result =  {
                    user: {
                        id: user?._id,
                        email: user?.email,
                        name: "",
                        avatarUrl: "",
                    },
                    accessToken: token,
                };  
                return result; 
            }
           
        }

        throw new NotFoundException("User not found");
}

async register(dto: {email: string, password: string}){
      try {
        const user = new this.userModel({...dto, role: ['admin'], verified: true});
        return await user.save();
      } catch (error) {
          if (error.code === 11000) {
            throw new ConflictException(`${dto.email} already exists`);
      }
      throw new InternalServerErrorException(error.message);
      }
    
    }

    async forgotPassword(dto: ForgotPasswordDto){
        const user = await this.userModel.findOne({email: dto.email});
        
        if(user != null && user.verified) {
            const token = this.createJwt(user);
            return await this.sendResetPassEmail(dto.email, token, dto.origin ?? "");
        }
        
        return {
            error: 'Email does not exist or has been verified'
        }
    
    }

    async resetPassword(dto: ResetPasswordDto){
        const payload = this.verifyJwt(dto.token);
        return await this.resetUserPass(payload['userId'], dto.password)
    
    }

    async resetUserPass(id: string, newPass: string) {
    
          const salt = await bcrypt.genSalt(10);
          const hashPass = await bcrypt.hash(newPass , salt);
          return await this.userModel.findByIdAndUpdate(id, {password: hashPass}, {new: true}).select('email');
        }


 createJwt(user: User): string {
        return jwt.sign(
            {
                userId: user._id,
                email: user.email
            },
            this.configService.get<string>('JWT_SECRET')!,
            {expiresIn: this.configService.get<string>('JWT_EXPIRES_IN')} as JwtSignOptions
        );
    }

    verifyJwt(token: string) {
        try {
           return jwt.verify(token, this.configService.get<string>('JWT_SECRET')!);
        } catch(err) {
            throw new UnauthorizedException('Token is invalid or expired');
        }
    }

    
    
        async sendVerificationEmail(to: string, token: string, origin: string) {
            const verifyUrl = `${origin}/?token=${token}`;
    
            const mailOptions = {
                from: `"HHCloset" <${"support@hhcloset.com"}>`,
                to,
                subject: 'Verify your email',
                html: `
                    <h3>Email Verification</h3>
                    <p>Click the link below to verify your email address:</p>
                    <a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
                    `,
            };
    
        try {
          await this.transporter.sendMail(mailOptions);
          return { message: 'Verification email sent. Please check your inbox.' };
        } catch (error) {
          throw new InternalServerErrorException('Failed to send verification email');
        }
        }
    
        async sendResetPassEmail(to: string, token: string, origin: string) {
            const resetPassUrl = `${origin}/?token=${token}`;
    
            const mailOptions = {
                from: `"HHCloset" <${"support@hhcloset.com"}>`,
                to,
                subject: 'Reset your password',
                html: `
                    <h3>Reset your password</h3>
                    <p>Click the link below to reset your password:</p>
                    <a href="${resetPassUrl}" target="_blank">${resetPassUrl}</a>
                    `,
            };
    
        try {
          await this.transporter.sendMail(mailOptions);
          return { message: 'Reset password email sent. Please check your inbox.' };
        } catch (error) {
          throw new InternalServerErrorException('Failed to send reset password email');
        }
        }

}
