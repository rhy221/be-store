import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CartService } from '../cart/cart.service';
import { Order } from '@app/database/schemas/order.shema';
import { Design } from '@app/database/schemas/design.schema';
import { Purchase } from '@app/database/schemas/purchase.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Purchase.name) private purchaseModel: Model<Purchase>,
    @InjectModel(Design.name) private designModel: Model<Design>,
    private cartService: CartService,
  ) {}

  async createOrder(userId: string, paymentMethod: string) {
    const cart = await this.cartService.getCart(userId);
    
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Create order items
    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await this.designModel.findById(item.productId);
        return {
          productId: item.productId,
          price: item.price,
          title: product?.title,
          imageUrl: product?.imageUrls[0]
        };
      })
    );

    const order = await this.orderModel.create({
      userId,
      items: orderItems,
      totalAmount: cart.totalAmount,
      // paymentMethod,
      status: 'completed', // Auto-complete for digital products
    });

    // Create purchase records
    await Promise.all(
      cart.items.map(async (item) => {
        await this.purchaseModel.create({
          userId: new Types.ObjectId(userId),
          productId: item.productId,
          // price: item.price,
          orderId: order._id,
        });

        // Update product statistics
        await this.designModel.findByIdAndUpdate(item.productId, {
          $inc: { purchaseCount: 1, totalEarning: item.price }
        });
      })
    );

    // Clear cart
    await this.cartService.clearCart(userId);

    return order;
  }

  async getOrders(userId: string) {
    return this.orderModel
      .find({ userId })
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.orderModel
      .findOne({ _id: orderId, userId })
      .populate('items.productId')
      .exec();

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}