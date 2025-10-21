import { Body, Controller, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserDto } from '../user/dtos/user.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { ResetpassDto } from '../user/dtos/resetpass.dto';


@Controller('auth')
export class AuthController {

    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly mailService: MailService
    ){}
    

    @Post('register')
    async register(@Body() dto: UserDto) {

        const user = await this.userService.create(dto);

        const token = this.authService.createJwt(user);

        return await this.mailService.sendVerificationEmail(dto.email, token);
    }

    @Post('send-verifyemail')
    async sendVerifyEmail(@Body() dto: UserDto) {

        const user = await this.userService.findOneByEmail(dto.email);
        
        if(user != null && !user.verified) {
            const token = this.authService.createJwt(user);
            return await this.mailService.sendVerificationEmail(dto.email, token);
        }
        
        return 'Email does not exist or has been verified';
    }

    @Post('send-resetpassemail')
    async sendResetPassEmail(@Body() dto: UserDto) {

        const user = await this.userService.findOneByEmail(dto.email);
        
        if(user != null && user.verified) {
            const token = this.authService.createJwt(user);
            return await this.mailService.sendVerificationEmail(dto.email, token);
        }
        
        return 'Email does not exist or has been verified';
    }

    @Post('verify/mail') 
    async verifyJwt(@Query('token') token: string) {
        
        const payload = this.authService.verifyJwt(token);
        return await this.userService.verifyUser(payload['userId'], true);
    }

    @Post('login')
    async login(@Body() dto: UserDto) {
        
        const user = await this.userService.findOneByEmail(dto.email);
        
        if(user != null && user.verified) {
            const isTheSame = await bcrypt.compare(dto.password, user.password)
            
            if(isTheSame) {
                const token = this.authService.createJwt(user);
                return token;  
            }
           
        }

        return {message: 'Wrong password or email'};
    }

    @UseGuards(JwtGuard)
    @Post('resetpass')
    async resetPassword(@Req() req, @Body() dto: ResetpassDto) {
        const id = req.user.userId;
        return await this.userService.resetUserPass(id, dto.password)
    }

   

}
