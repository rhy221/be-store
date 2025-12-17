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
                @InjectModel(Following.name) private readonly followingModels: Model<Following>,

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
        return await this.desingerProfileModel.findOne({userId}).select('userId name avatarUrl bio');
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
      
      const following = await this.followingModels.findOne({followerId: new Types.ObjectId(viewerId), designerId: new Types.ObjectId(userId)}).exec();
      
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
  
    
}
