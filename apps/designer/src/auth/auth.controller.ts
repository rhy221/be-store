import { Body, Controller, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResendEmailVerificationDto, ResetPasswordDto, VerifyMailDto } from './auth.dto';
import { Types } from 'mongoose';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly mailService: MailService
    ){}
    

    @Post('register')
    async register(@Body() dto: RegisterDto) {

        const user = await this.userService.create(dto);

        const token = this.authService.createJwt(user);

        return await this.mailService.sendVerificationEmail(dto.email, token, dto.origin ?? "");
    }

    @Post('send-verifyemail')
    async sendVerifyEmail(@Body() dto: ResendEmailVerificationDto) {

        const user = await this.userService.findOneByEmail(dto.email);
        
        if(user != null && !user.verified) {
            const token = this.authService.createJwt(user);
            return await this.mailService.sendVerificationEmail(dto.email, token, dto.origin ?? "");
        }
        
        return {
            error: 'Email does not exist or has been verified'
        }
    }

    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {

        const user = await this.userService.findOneByEmail(dto.email);
        
        if(user != null && user.verified) {
            const token = this.authService.createJwt(user);
            return await this.mailService.sendResetPassEmail(dto.email, token, dto.origin ?? "");
        }
        
        return {
            error: 'Email does not exist or has been verified'
        }
    }

    @Post('verify') 
    async verifyMail(@Body() dto: VerifyMailDto) {
        const payload = this.authService.verifyJwt(dto.token);
        const user = await this.userService.verifyUser(payload['userId'], true);
        const userProfile = await this.userService.createInitialProfile(payload['userId'], payload['email']);
        const token = this.authService.createJwt(user!);

       const result =  {
                    user: {
                        id: userProfile?.userId,
                        email: userProfile?.email,
                        name: userProfile?.name,
                        avatarUrl: userProfile?.avatarUrl,
                    },
                    accessToken: token,
                };  
                return result; 
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        
        const user = await this.userService.findOneByEmail(dto.email);
        
        if(user != null && user.verified) {
            const isTheSame = await bcrypt.compare(dto.password, user.password)
            
            if(isTheSame) {
                const token = this.authService.createJwt(user);
                const userProfile = await this.userService.findUserProfile((user._id as Types.ObjectId).toString(), "basics");
                const result =  {
                    user: {
                        id: userProfile?.userId,
                        email: userProfile?.email,
                        name: userProfile?.name,
                        avatarUrl: userProfile?.avatarUrl,
                    },
                    accessToken: token,
                };  
                return result; 
            }
           
        }

        throw new UnauthorizedException();
    }

    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        const payload = this.authService.verifyJwt(dto.token);
        return await this.userService.resetUserPass(payload['userId'], dto.password)
    }

   

}
