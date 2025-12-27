import { AdminJwtGuard } from './admin-guard.guard';

describe('AdminGuardGuard', () => {
  it('should be defined', () => {
    expect(new AdminJwtGuard()).toBeDefined();
  });
});
