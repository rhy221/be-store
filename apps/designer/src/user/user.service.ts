import { User } from '@app/database/schemas/user.schema';
import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDto } from './dtos/user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {

    constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}
    
    async create(dto: UserDto): Promise<User> {
      try {
        const created = new this.userModel({...dto, verified: false});
        return await created.save();
      } catch (error) {
          if (error.code === 11000) {
            throw new ConflictException(`${dto.email} already exists`);
      }
      throw new InternalServerErrorException(error.message);
      }
    
    }

    async fintOneById(id: string) {
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

  
    
}
