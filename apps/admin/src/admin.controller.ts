import { Controller, Get, Query, Param, Post, Body, Patch, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { ForgotPasswordDto, LoginDto, ResetPasswordDto } from './admin.dto'
import { AdminJwtGuard } from '@app/common/guards/admin-jwt.guard'
import { OptionalJwtGuard } from '@app/common/guards/optional-jwt.guard'

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(AdminJwtGuard)
  @Get('quick-stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats()
  }
  
  @UseGuards(AdminJwtGuard)
  @Get('users')
  getUsers(@Query() q: any) {
    return this.adminService.getUsers(q)
  }

  @UseGuards(AdminJwtGuard)
  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id)
  }

    @UseGuards(AdminJwtGuard)
  @Get('users/:id/designs')
  async getUserDesigns(@Param('id') id: string) {
    return this.adminService.getUserDesigns(id);
  }


    @UseGuards(AdminJwtGuard)
  @Get('categories')
  getCategories(@Query() q: any) {
    return this.adminService.getCategories(q)
  }

    @UseGuards(AdminJwtGuard)
  @Get('categories/:id')
  getCategoryDetail(@Param('id') id: string) {
    return this.adminService.getCategoryDetail(id)
  }

    @UseGuards(AdminJwtGuard)
  @Get('categories/:id/products')
  getCategoryProducts(@Param('id') id: string, @Query() param: any) {
    return this.adminService.getCategoryProducts(id, param)
  }

    @UseGuards(AdminJwtGuard)
  @Post('categories')
  createCategory(@Body() dto: { name: string; slug: string; styles: string[] }) {
    return this.adminService.createCategory(dto)
  }

    @UseGuards(AdminJwtGuard)
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateCategory(id, dto)
  }

    @UseGuards(AdminJwtGuard)
  @Patch('categories/delete/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id)
  }

    @UseGuards(AdminJwtGuard)
  @Get('reports')
  getReports() {
    return this.adminService.getReports()
  }

    @UseGuards(AdminJwtGuard)
  @Post('reports')
  createReport(@Body() dto: { content: string; category: string; createdBy: string }) {
    return this.adminService.createReport(dto)
  }

    @UseGuards(AdminJwtGuard)
  @Get('rankings')
  getTopRankings() {
    return this.adminService.getTopRankings()
  }

    @UseGuards(AdminJwtGuard)
  @Get('templates')
  getTemplates() {
    return this.adminService.getTopTemplates()
  }

    @UseGuards(AdminJwtGuard)
  @Get('designers')
  getDesigners() {
    return this.adminService.getTopDesigners()
  }

    @UseGuards(AdminJwtGuard)
  @Get('product-stats')
  getProductStats() {
    return this.adminService.getProductStats()
  }

    @UseGuards(AdminJwtGuard)
  @Get('role-stats')
  getRoleStats() {
    return this.adminService.getRoleStats()
  }

    @UseGuards(AdminJwtGuard)
  @Get('unlock-requests')
  getUnlockRequests() {
    return this.adminService.getUnlockRequests()
  }

  // @Patch('users/:id/state')
  // updateUserState(
  //   @Param('id') id: string,
  //   @Body() dto: { state: 'active' | 'banned' },
  // ) {
  //   return this.adminService.updateUserState(id, dto.state);
  // }

    @UseGuards(AdminJwtGuard)
@Patch('users/:id/state')
async toggleUserStatus(
  @Param('id') id: string,
  @Body() dto: { state: 'active' | 'banned', reason: string },
  // @Req() req
) {
  return this.adminService.updateUserState(id, dto);
  
}

@UseGuards(OptionalJwtGuard)
@Post('login')
    async login(@Body() dto: LoginDto) {
                  console.log("fdfd");

        return this.adminService.login(dto);
    }


@UseGuards(OptionalJwtGuard)
@Post('register')
    async register(@Body() dto: {email: string, password: string}) {

      return this.adminService.register(dto);
    }

    @UseGuards(OptionalJwtGuard)
    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {

        return this.adminService.forgotPassword(dto);
    }

    @UseGuards(OptionalJwtGuard)
    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.adminService.resetPassword(dto);
    }


  
}
