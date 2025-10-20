import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserDto } from '../user/dtos/user.dto';
import * as jwt from 'jsonwebtoken'
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '@app/database/schemas/user.schema';
import { MailService } from '../mail/mail.service';
@Injectable()
export class AuthService {

    constructor(
        private readonly configService: ConfigService, 
        private readonly userService: UserService,
        private readonly mailService: MailService){}

    async register(dto: UserDto) {
        
        const user = await this.userService.create(dto);

        const token = this.createJwt(user);

        await this.mailService.sendVerificationEmail(dto.email, token);

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

}
