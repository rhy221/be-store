import { Controller, Get, Query, Param, Post, Body, Patch } from '@nestjs/common'
import { AdminService } from './admin.service'

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('quick-stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats()
  }

  /* ================= USERS ================= */

  @Get('users')
  getUsers(@Query() q: any) {
    return this.adminService.getUsers(q)
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id)
  }

  /* ================= CATEGORIES ================= */

  @Get('categories')
  getCategories(@Query() q: any) {
    return this.adminService.getCategories(q)
  }

  @Get('categories/:id')
  getCategoryDetail(@Param('id') id: string) {
    return this.adminService.getCategoryDetail(id)
  }

  @Get('categories/:id/products')
  getCategoryProducts(
    @Param('id') id: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getCategoryProducts(id, search)
  }

  @Post('categories')
  createCategory(@Body() dto: { name: string; slug: string; styles: string[] }) {
    return this.adminService.createCategory(dto)
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateCategory(id, dto)
  }

  @Patch('categories/delete/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id)
  }

  /* ================= REPORTS ================= */

  @Get('reports')
  getReports() {
    return this.adminService.getReports()
  }

  @Post('reports')
  createReport(@Body() dto: { content: string; category: string; createdBy: string }) {
    return this.adminService.createReport(dto)
  }

  /* ================= RANKINGS ================= */

  @Get('rankings')
  getTopRankings() {
    return this.adminService.getTopRankings()
  }

  @Get('templates')
  getTemplates() {
    return this.adminService.getTopTemplates()
  }

  @Get('designers')
  getDesigners() {
    return this.adminService.getTopDesigners()
  }

  @Get('product-stats')
  getProductStats() {
    return this.adminService.getProductStats()
  }

  @Get('role-stats')
  getRoleStats() {
    return this.adminService.getRoleStats();
  }
}
