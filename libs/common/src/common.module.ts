import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { UserModule } from 'apps/designer/src/user/user.module';

@Module({
  imports: [UserModule],
  providers: [CommonService, AdminJwtStrategy],
  exports: [CommonService, AdminJwtStrategy],
})
export class CommonModule {}
