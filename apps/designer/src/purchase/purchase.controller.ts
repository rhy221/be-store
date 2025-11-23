import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';

@Controller('purchases')
@UseGuards(JwtGuard)
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get('my-purchases')
  async getPurchasedProducts(@Request() req) {
    return this.purchaseService.getPurchasedProducts(req.user.userId);
  }

  @Post('download/:productId')
  async downloadProduct(@Request() req, @Param('productId') productId: string) {
    return this.purchaseService.downloadProduct(req.user.userId, productId);
  }

  @Get('check/:productId')
  async checkPurchaseStatus(@Request() req, @Param('productId') productId: string) {
    return this.purchaseService.checkPurchaseStatus(req.user.userId, productId);
  }
}