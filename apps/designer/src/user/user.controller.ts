import { Body, Controller, Get, Param, Patch, Post, Query, Req, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { DesignerProfileDto, DesignerProfileUpdatingDto } from './user.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '@app/storage/storage.service';
import { OptionalJwtGuard } from '@app/common/guards/optional-jwt.guard';

@Controller('users')
export class UserController {

    constructor(private readonly userService: UserService,
            private readonly storageService: StorageService
    ){}
    
    @UseGuards(OptionalJwtGuard)
    @Get('profile')
    async getProfile(@Req() req, @Query('infor') opt: 'basics' | 'statics'){
        const id = req.user.userId;
        const email = req.user.email;
        let profile;
    

        
        if(opt === 'basics') {
            profile = await this.userService.findUserProfile(id, 'basics')
        } else if(opt === 'statics') {
            profile = await this.userService.findUserProfile(id, 'statics')
        } else {
            profile = await this.userService.findUserProfile(id)
        }

        return {
                email: email,
                ...profile
        }

    }

    @UseGuards(OptionalJwtGuard)
    @Get('portfolio')
    async getPortfolio(@Req() req, @Query('userId') userId){
        const viewerId = req?.user?.userId;
      return this.userService.findUserPortfolio(userId, viewerId);
    }

    @UseGuards(JwtGuard)
    @UseInterceptors(FileInterceptor('avatar'))
    @Patch('profile')
    async updateProfile(@UploadedFile() file: Express.Multer.File,@Req() req,   @Body() dto: DesignerProfileUpdatingDto){
        if(file)
            console.log('file exist');
        else console.log('not')
        const userId = req.user.userId;
        
        if (!userId) {
            throw new BadRequestException('User ID is missing in the authentication token.');
        }

        const result = await this.storageService.upload(file);
        // dto.avatarUrl = result.url;
        return await this.userService.updateUserProfile(userId, dto);
    }

    @UseGuards(JwtGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'avatar', maxCount: 1 }, 
    { name: 'banner', maxCount: 1 },
  ]))
  @Patch('portfolio')
  async updatePortfolio(
    @UploadedFiles() files: { 
        avatar?: Express.Multer.File[], 
        banner?: Express.Multer.File[] 
    }, 
    @Req() req, 
    @Body() dto: DesignerProfileUpdatingDto
  ) {    
      const userId = req.user.userId;

     
      const avatarFile = files?.avatar?.[0]; 
      const bannerFile = files?.banner?.[0];

   
      return await this.userService.updateUserPortfolio(
          userId, 
          dto, 
          avatarFile, 
          bannerFile  
      );
  }

@UseGuards(OptionalJwtGuard)
  @Get(':id/followers')
  async getFollowers(
    @Param('id') id: string, 
    @Req() req
  ) {
    const currentUserId = req.user?.userId || req.user?.id || null; 
    return this.userService.getFollowers(id, currentUserId);
  }

  @UseGuards(OptionalJwtGuard)
  @Get(':id/following')
  async getFollowing(
    @Param('id') id: string, 
    @Req() req
  ) {
    const currentUserId = req.user?.userId || req.user?.id || null;
    return this.userService.getFollowing(id, currentUserId);
  }
    
}