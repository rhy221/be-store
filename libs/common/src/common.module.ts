import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { UserModule } from 'apps/designer/src/user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [UserModule],
  providers: [CommonService, AdminJwtStrategy, JwtStrategy],
  exports: [CommonService, AdminJwtStrategy, JwtStrategy],
})
export class CommonModule {}
