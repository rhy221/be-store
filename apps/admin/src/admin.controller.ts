import { Controller, Get, Query, Param, Post, Body, Patch } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('quick-stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(@Query() q: any) {
    return this.adminService.getUsers(q);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Get('categories')
  getCategories(@Query() q: any) {
    return this.adminService.getCategories(q);
  }

  @Post('categories')
  createCategory(@Body() dto: { name: string; slug: string; styles: string[] }) {
    return this.adminService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateCategory(id, dto);
  }

  @Patch('categories/delete/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  @Get('reports')
  getReports() {
    return this.adminService.getReports();
  }

  @Post('reports')
  createReport(@Body() dto: { content: string; category: string; createdBy: string }) {
    return this.adminService.createReport(dto);
  }

  @Get('rankings')
  getTopRankings() {
    return this.adminService.getTopRankings();
  }

  @Get('templates')
  async getTemplates() {
    const templates = await this.adminService.getTopTemplates();
    return templates.map(t => ({
      title: t.title,
      viewCount: t.viewCount,
      icon: t.icon || 'shirt',
    }));
  }

  @Get('designers')
  async getDesigners() {
    const designers = await this.adminService.getTopDesigners();
    return designers.map(d => ({
      name: d.name,
      followerCount: d.followerCount,
      icon: d.icon || 'user',
    }));
  }
}
