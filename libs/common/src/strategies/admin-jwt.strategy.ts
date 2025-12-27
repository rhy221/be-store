// admin-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from 'apps/designer/src/user/user.service';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'jwt-admin') { 
   constructor(private configService: ConfigService,
                private userService: UserService,
     ) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
        ignoreExpiration: false, 
        secretOrKey: configService.get<string>('JWT_SECRET')!, 
      });
    }
  
    async validate(payload: any) {
  
      if (!payload || !payload.userId) {
        throw new UnauthorizedException('Invalid token payload');
      }
  
      const user = await this.userService.findOneById(payload.userId);
  
      if (!user || user.state !== 'active') {
        throw new UnauthorizedException('User has been bannned');
      }

      if (!user.role.includes("admin")) {
        throw new UnauthorizedException('User has to be an admin');
      }
  
      return { userId: payload.userId, email: payload.email };
    }
}