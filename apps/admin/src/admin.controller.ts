import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /* ================= DASHBOARD ================= */

  @Get('quick-stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  /* ================= USERS ================= */

  @Get('users')
  getUsers(@Query() q: any) {
    return this.adminService.getUsers(q);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  /* ================= CATEGORIES ================= */

  @Get('categories')
  getCategories(@Query() q: any) {
    return this.adminService.getCategories(q);
  }

  @Post('categories')
  createCategory(
    @Body()
    dto: {
      name: string;
      slug: string;
      styles: string[];
    },
  ) {
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

  /* ================= REPORTS ================= */

  @Get('reports')
  getReports() {
    return this.adminService.getReports();
  }

  @Post('reports')
  createReport(
    @Body()
    dto: {
      content: string;
      category: string;
      createdBy: string;
    },
  ) {
    return this.adminService.createReport(dto);
  }
}
