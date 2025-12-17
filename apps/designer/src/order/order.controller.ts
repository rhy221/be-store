import { Controller, Get, Post, Body, Param, UseGuards, Request, Req, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { JwtAuthGuard } from 'apps/be-store/src/auth/guards/jwt-auth.guard';
import { GetMyOrdersDto } from './order.dto';

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

  @Get('my-orders')
  async getMyOrders(@Req() req, @Query() query: GetMyOrdersDto) {
    return this.orderService.getMyOrders(req.user.userId, query);
  }

  @Get(':id')
  async getOrderById(@Req() req, @Param('id') id: string) {
    return this.orderService.getOrderById(id, req.user.userId);
  }
}