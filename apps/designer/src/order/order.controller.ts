import { Controller, Get, Post, Body, Param, UseGuards, Request, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';

@Controller('orders')
@UseGuards(JwtGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  async createOrder(@Req() req, @Body() body: { paymentMethod: string }) {
    return this.orderService.createOrder(req.user.userId, body.paymentMethod);
  }

  @Get()
  async getOrders(@Req() req) {
    return this.orderService.getOrders(req.user.userId);
  }

  @Get(':id')
  async getOrderById(@Req() req, @Param('id') id: string) {
    return this.orderService.getOrderById(id, req.user.userId);
  }
}