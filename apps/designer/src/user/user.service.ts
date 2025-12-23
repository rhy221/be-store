import { User } from '@app/database/schemas/user.schema';
import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from '../auth/auth.dto';
import { DesignerProfile } from '@app/database/schemas/designerProfile.shema';
import { DesignerProfileDto, DesignerProfileUpdatingDto } from './user.dto';
import { StorageService } from '@app/storage';
import { Following } from '@app/database/schemas/following.schema';

@Injectable()
export class UserService {

    constructor(@InjectModel(User.name) private readonly userModel: Model<User>,
                @InjectModel(DesignerProfile.name) private readonly desingerProfileModel: Model<DesignerProfile>,
                @InjectModel(Following.name) private readonly followingModel: Model<Following>,

                private readonly storageService: StorageService ) {}
    
    async create(dto: RegisterDto): Promise<User> {
      try {
        const created = new this.userModel({...dto, role: ['designer'], verified: false});
        return await created.save();
      } catch (error) {
          if (error.code === 11000) {
            throw new ConflictException(`${dto.email} already exists`);
      }
      throw new InternalServerErrorException(error.message);
      }
    
    }

    async createProfile(dto: DesignerProfileDto){
      const created = new this.desingerProfileModel({...dto});
      return await created.save();
    }

    async createInitialProfile(userid: string, email: string) {
      const created = new this.desingerProfileModel({
        userId: userid,
        name: `${email.split('@')[0] ?? ""}`,
        email: email,
        bio: "",
        avatarUrl: "",
        status: 'active',
        followerCount: 0,
        totalDesigns: 0,
        totalSold: 0,
        totalRevenue: 0,
        likeCount: 0,
        rating: 0
      });

      try {
      return await created.save();

      }
      catch(error) {
        console.log(error);
      }
    }



    async findOneById(id: string) {
      return await this.userModel.findById(id);
    }

    async findOneByEmail(email: string) {
      return await this.userModel.findOne({email});
    }

    async verifyUser(id: string, isVevified: boolean) {
      return await this.userModel.findByIdAndUpdate(id, {verified: isVevified}, {new: true}).select('email verified');
    }

    async resetUserPass(id: string, newPass: string) {

      const salt = await bcrypt.genSalt(10);
      const hashPass = await bcrypt.hash(newPass , salt);
      return await this.userModel.findByIdAndUpdate(id, {password: hashPass}, {new: true}).select('email');
    }

    // async comparePass(id: string, comparedPass: string) {
    //   const pass = (await this.userModel.findById(id).select('password').lean())?.password;
    //   const isSame = await bcrypt.compare(comparedPass, pass);
    //   return isSame;
    // }

    async findUserProfile(id: string, opt: 'basics' | 'statics' | null = null) {
     
      const userId = new Types.ObjectId(id);
      if(opt === 'basics') {
        return await this.desingerProfileModel.findOne({userId}).select('userId name email avatarUrl bio');
      }
      else if(opt === 'statics') {
        return await this.desingerProfileModel.findOne({userId}).select('followerCount followingCount totalDesigns totalSold totalRevenue likeCount rating');
      }

      return await this.desingerProfileModel.findOne({userId}, {_id: 0}).lean();
    }

    async findUserPortfolio(id: string, viewerId?: string) {
     
      const userId = new Types.ObjectId(id);

      if(!userId) throw new NotFoundException('User not found');

      const designerProfile = await this.desingerProfileModel.findOne({userId}).exec();

      if(!viewerId)
        return designerProfile;
      
      const following = await this.followingModel.findOne({followerId: new Types.ObjectId(viewerId), designerId: new Types.ObjectId(userId)}).exec();
      
      return {
        ...designerProfile?.toJSON(),
        isFollowing: following ? true : false
      }
    }

    async updateUserProfile(userId: string, dto: DesignerProfileUpdatingDto) {
      return await this.desingerProfileModel.findOneAndUpdate({userId: userId}, {...dto}, {new: true}).select('userId name avatarUrl bio');
    }

    async updateUserPortfolio(userId: string, dto: DesignerProfileUpdatingDto, avatarFile?: Express.Multer.File, bannerFile?: Express.Multer.File) {
      const userProfile = await this.desingerProfileModel.findOne({userId: new Types.ObjectId(userId)}).exec();
      
      if(!userProfile)
        throw new NotFoundException('User not found');

      if(avatarFile) {
        if(userProfile.avatarUrl) {
          await this.storageService.deleteFile(this.storageService.getPublicIdFromUrl(userProfile.avatarUrl) || '');
        }
        const {url} = await this.storageService.upload(avatarFile);
        if(url) {
          userProfile.avatarUrl = url;
        }
      }

      if(bannerFile) {
        if(userProfile.bannerUrl) {
          await this.storageService.deleteFile(this.storageService.getPublicIdFromUrl(userProfile.bannerUrl) || '');
        }
        const {url} = await this.storageService.upload(bannerFile);
        if(url) {
          userProfile.bannerUrl = url;
        }
      }
      if(dto.name) {
        userProfile.name = dto.name;
      }
      if(dto.bio) {
        userProfile.bio = dto.bio;
      }
      await userProfile.save();
      return userProfile;
    }
  
    async getFollowers(targetProfileId: string, currentUserId?: string) {
    // B1: Lấy danh sách raw từ DB
    const followersRaw = await this.followingModel
      .find({ designerId: new Types.ObjectId(targetProfileId) })
      .populate('followerProfile', 'name avatarUrl bio userId') // Populate thông tin người follow
      .lean();

    // Lấy ra danh sách profile người dùng
    const usersList = followersRaw.map((f: any) => f.followerProfile);

    // B2: Map thêm trạng thái isFollowing
    return this.checkIsFollowingStatus(usersList, currentUserId);
  }

  // --- 2. LẤY DANH SÁCH FOLLOWING (PROFILE NÀY ĐANG THEO DÕI AI) ---
  async getFollowing(targetProfileId: string, currentUserId?: string) {
    // B1: Lấy danh sách raw từ DB
    const followingRaw = await this.followingModel
      .find({ followerId: new Types.ObjectId(targetProfileId) })
      .populate('designerProfile', 'name avatarUrl bio userId') // Populate thông tin người được follow
      .lean();

    // Lấy ra danh sách profile người dùng
    const usersList = followingRaw.map((f: any) => f.designerProfile);

    // B2: Map thêm trạng thái isFollowing
    return this.checkIsFollowingStatus(usersList, currentUserId);
  }

  // --- HELPER: KIỂM TRA TRẠNG THÁI FOLLOW ---
  private async checkIsFollowingStatus(usersList: any[], currentUserId?: string) {
    // Nếu không có userList hoặc người xem chưa đăng nhập -> Mặc định là false
    if (!usersList.length || !currentUserId) {
      return usersList.map(user => ({ ...user, isFollowing: false }));
    }

    // Lấy danh sách ID của những người trong list kết quả
    const targetUserIds = usersList.map(user => user.userId);

    // Tìm trong DB xem currentUserId có follow ai trong danh sách trên không
    const myFollowings = await this.followingModel.find({
      followerId: new Types.ObjectId(currentUserId),
      designerId: { $in: targetUserIds } // Chỉ check những người có trong list hiển thị
    }).select('designerId').lean();

    // Tạo Set các ID mà mình đang follow để tra cứu cho nhanh (O(1))
    // Chuyển ObjectId sang string để so sánh
    const myFollowingSet = new Set(myFollowings.map(f => f.designerId.toString()));

    // Map lại kết quả cuối cùng
    return usersList.map(user => ({
      ...user,
      // Kiểm tra: ID của người này có nằm trong danh sách mình đang follow không?
      // Hoặc: Người này chính là mình (không hiện nút follow cho chính mình)
      isFollowing: myFollowingSet.has(user.userId.toString()),
      isMe: user.userId.toString() === currentUserId // Optional: Để FE ẩn nút follow nếu là chính mình
    }));
  }
}
