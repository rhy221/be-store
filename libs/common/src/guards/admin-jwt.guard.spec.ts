import { AdminJwtGuard } from './admin-jwt.guard';

describe('AdminGuardGuard', () => {
  it('should be defined', () => {
    expect(new AdminJwtGuard()).toBeDefined();
  });
});
