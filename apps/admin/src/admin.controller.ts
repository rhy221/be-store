import { Controller, Get, Query, Param, Post, Body, Patch } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('quick-stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('weekly-designs')
  getTemplatesPerWeek() {
    return this.adminService.getTemplatesPerWeek();
  }

  @Get('daily-access')
  getUsersDaily() {
    return this.adminService.getUsersDaily();
  }

  @Get('rankings')
  getRankings() {
    return this.adminService.getDashboardStats(); 
  }
  
  @Get('reports')
  getReports(@Query() q: any) {
    return this.adminService.getReports(q);
  }

  @Patch('reports/reject/:id')
  rejectReport(@Param('id') id: string) {
    return this.adminService.rejectReport(id);
  }

  @Patch('reports/warn/:userId')
  warnUser(@Param('userId') userId: string) {
    return this.adminService.warnUser(userId);
  }

  @Patch('reports/block/:userId')
  blockUser(@Param('userId') userId: string) {
    return this.adminService.blockUser(userId);
  }
  
  @Get('unlock-requests')
  getUnlockRequests() {
    return []; 
  }

  @Get('users')
  getUsers(@Query() q: any) {
    return this.adminService.getUsers(q);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/block/:id')
  blockUserAccount(@Param('id') id: string) {
    return this.adminService.blockUserAccount(id);
  }

  @Patch('users/unlock/:id')
  unlockUser(@Param('id') id: string) {
    return this.adminService.unlockUser(id);
  }

  @Get('categories')
  getCategories(@Query() q: any) {
    return this.adminService.getCategories(q);
  }

  @Post('categories')
  createCategory(@Body() dto: any) {
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
}