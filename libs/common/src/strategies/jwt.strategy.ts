import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'apps/designer/src/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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

    return { userId: payload.userId, email: payload.email };
  }
}