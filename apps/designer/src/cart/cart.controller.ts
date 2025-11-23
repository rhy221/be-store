import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { AddToCartDto, RemoveFromCartDto, UpdateCartItemDto } from './cart.dto';

@Controller('cart')
@UseGuards(JwtGuard)
export class CartController {
    constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post('add')
  async addToCart(@Req() req, @Body() body: { productId: string }) {
    return this.cartService.addToCart(req.user.userId, body.productId);
  }

  @Delete('remove')
  async removeFromCart(@Req() req, @Body() body: { productId: string }) {
    return this.cartService.removeFromCart(req.user.userId, body.productId);
  }

  @Delete('clear')
  async clearCart(@Req() req) {
    return this.cartService.clearCart(req.user.userId);
  }
}
