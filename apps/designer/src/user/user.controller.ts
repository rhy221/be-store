import { Body, Controller, Get, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { DesignerProfileDto, DesignerProfileUpdatingDto } from './user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UserController {

    constructor(private readonly userService: UserService){}
    
    @UseGuards(JwtGuard)
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

    @UseGuards(JwtGuard)
    @UseInterceptors(FileInterceptor('avatar'))
    @Patch('profile')
    async updateProfile(@UploadedFile() file: Express.Multer.File,@Req() req,  @Body() dto: DesignerProfileUpdatingDto){
        if(file)
            console.log('file exist');
        else console.log('not')
        const userId = req.user.userId;
        return await this.userService.updateUserProfile(userId, dto);
    }

    
}
