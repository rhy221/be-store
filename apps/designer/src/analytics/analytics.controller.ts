import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';

@Controller('analytics')
export class AnalyticsController {

    constructor(private readonly analyticsService: AnalyticsService) {}
    @UseGuards(JwtGuard)
    @Get('revenue-by-week')
    async getRevenueByWeek(
        @Req() req,
        @Query('month') month: number,
        @Query('year') year: number,
    ) {
        const designerId = req.user.userId;
     return this.analyticsService.getRevenueByWeek(month, year, designerId);
    }

    @UseGuards(JwtGuard)
  @Get('sales-history')
  async getSalesHistory(
     @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
     const designerId = req.user.userId;
     return this.analyticsService.getSalesHistory(page, limit, designerId);
  }

  @Get('category-distribution')
  async getCategoryDistribution(@Query('designerId') designerId: string) {
    return this.analyticsService.getCategoryDistribution(designerId);
  }
}
