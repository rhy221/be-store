import { Cart } from '@app/database/schemas/cart.schema';
import { Design } from '@app/database/schemas/design.schema';
import { Purchase } from '@app/database/schemas/purchase.schema';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';


@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Design.name) private designModel: Model<Design>,
    @InjectModel(Purchase.name) private purchaseModel: Model<Purchase>,
  ) {}

async getCart(userId: string) {
  // BƯỚC 1: Tìm giỏ hàng cơ bản trước (nhẹ database)
  let cart = await this.cartModel.findOne({ userId: new Types.ObjectId(userId) });

  // BƯỚC 2: Nếu chưa có thì tạo mới và trả về luôn
  if (!cart) {
    cart = await this.cartModel.create({
      userId: new Types.ObjectId(userId),
      items: [],
    });
    return { ...cart.toObject(), totalAmount: 0 };
  }

  // BƯỚC 3: Nếu giỏ hàng rỗng, không cần chạy Aggregation nặng nề
  if (cart.items.length === 0) {
    return { ...cart.toObject(), totalAmount: 0 };
  }

  // BƯỚC 4: Chỉ chạy Aggregation khi chắc chắn có items
  const result = await this.cartModel.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    { $unwind: '$items' },
    
    // Lookup Design
    {
      $lookup: {
        from: 'designs',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: {
    path: '$productDetails',
    preserveNullAndEmptyArrays: true
  } },

    // Lookup Designer
    {
      $lookup: {
        from: 'designerProfiles',
        let: { designerId: '$productDetails.designerId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$userId', '$$designerId'] } } },
          { $project: { _id: 0, name: 1, email: 1, userId: 1 } }
        ],
        as: 'designerInfo'
      }
    },
    { 
      $unwind: { path: '$designerInfo', preserveNullAndEmptyArrays: true } 
    },

    // Group lại
    {
      $group: {
        _id: '$_id',
        userId: { $first: '$userId' },
        totalAmount: { $sum: '$productDetails.price' },
        items: {
          $push: {
            productId: '$items.productId',
            title: '$productDetails.title',
            price: '$productDetails.price',
            imageUrls: '$productDetails.imageUrls',
            designer: '$designerInfo'
          }
        }
      }
    }
  ]).exec();
  return result[0];
}

  async addToCart(userId: string, productId: string) {
    const product = await this.designModel.findById(productId).exec();
    if (!product) throw new NotFoundException('Product not found');

    // Check if already purchased
    const purchase = await this.purchaseModel.findOne({ userId: new Types.ObjectId(userId), productId: new Types.ObjectId(productId) });
    if (purchase) {
      throw new BadRequestException('You already own this product');
    }

    let cart = await this.cartModel.findOne({ userId: new Types.ObjectId(userId) });
    
    if (!cart) {
      cart = await this.cartModel.create({
      userId: new Types.ObjectId(userId),
        items: [],
      });
    }

    // Check if already in cart
    const existingItem = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (existingItem) {
      throw new BadRequestException('Product already in cart');
    }

    cart.items.push({
      productId: new Types.ObjectId(productId),
    });

    // cart.totalAmount += product.price;

    await cart.save();
    return this.getCart(userId);
  }

  async removeFromCart(userId: string, productId: string) {
    const cart = await this.cartModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart) throw new NotFoundException('Cart not found');
    const product = await this.designModel.findById(productId).exec();
    if (!product) throw new NotFoundException('Product not found');


    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    // cart.totalAmount -= product.price;

    await cart.save();
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    await this.cartModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { items: [] }
    );
  }
}