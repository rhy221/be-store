import { User } from '@app/database/schemas/user.schema';
import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from '../auth/auth.dto';
import { DesignerProfile } from '@app/database/schemas/designerProfile.shema';
import { DesignerProfileDto, DesignerProfileUpdatingDto } from './user.dto';

@Injectable()
export class UserService {

    constructor(@InjectModel(User.name) private readonly userModel: Model<User>,
                @InjectModel(DesignerProfile.name) private readonly desingerProfileModel: Model<DesignerProfile> ) {}
    
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
     
      if(opt === 'basics') {
        return await this.desingerProfileModel.findOne({userId: id}).select('userId name avatarUrl bio');
      }
      else if(opt === 'statics') {
        return await this.desingerProfileModel.findOne({userId: id}).select('followerCount totalDesigns totalSold totalRevenue');
      }

      return await this.desingerProfileModel.findOne({userId: id}, {_id: 0}).lean();
    }

    async updateUserProfile(userId: string, dto: DesignerProfileUpdatingDto) {
      return await this.desingerProfileModel.findOneAndUpdate({userId: userId}, {...dto}, {new: true}).select('userId name avatarUrl bio');
    }
  
    
}
