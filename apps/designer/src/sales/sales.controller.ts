import { JwtGuard } from '@app/common/guards/jwt.guard';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { GetSalesDto } from './sales.dto';

@Controller('sales')
export class SalesController {

    constructor(private readonly salesService: SalesService) {}

    @Get()
  @UseGuards(JwtGuard) // Đảm bảo có Auth
  async getSales(@Query() query: GetSalesDto, @Req() req) {
    // Giả sử lấy designerId từ token
    const designerId = req.user.userId; 
    return this.salesService.getSellerSales(designerId, query);
  }
}
