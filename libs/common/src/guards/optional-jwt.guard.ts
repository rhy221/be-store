import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Gọi Passport để parse JWT nếu có
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  handleRequest(err: any, user: any) {
    // Không throw lỗi -> optional
    if (err) {
      return null;
    }
    // user sẽ là undefined nếu không có token
    return user || null;
  }
}
