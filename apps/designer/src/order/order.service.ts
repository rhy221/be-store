import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, PipelineStage, Types } from 'mongoose';

import { CartService } from '../cart/cart.service';
import { Order } from '@app/database/schemas/order.shema';
import { Design } from '@app/database/schemas/design.schema';
import { Purchase } from '@app/database/schemas/purchase.schema';
import { GetMyOrdersDto } from './order.dto';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notificatio.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Purchase.name) private purchaseModel: Model<Purchase>,
    @InjectModel(Design.name) private designModel: Model<Design>,
    private readonly cartService: CartService,
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationService: NotificationService
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
      userId: new Types.ObjectId(userId),
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
       const updatedDesign = await this.designModel.findByIdAndUpdate(
          item.productId,
          { 
            $inc: { purchaseCount: 1, totalEarning: item.price } 
          },
          { new: true } 
        ).exec();

        if (updatedDesign && updatedDesign.designerId) {
            // if (updatedDesign.designerId.toString() !== userId) {
                await this.notificationService.create({
                    userId: updatedDesign.designerId.toString(), // ID của Designer
                    title: 'Item Sold!',
                    message: `You sold "${updatedDesign.title}" for ${item.price}VND`,
                    type: NotificationType.ORDER_PURCHASED, // Enum bạn đã định nghĩa
                    thumbnail: updatedDesign.imageUrls?.[0] || '', // Lấy ảnh đầu tiên làm thumbnail
                    // link: `/dashboard/analytics` // 
                    relatedEntityId: (updatedDesign._id as Types.ObjectId).toString(),
                });
            // }
        }
      })
    );

    // Clear cart
    await this.cartService.clearCart(userId);

    

    return order;
  }

  async createAuctionOrder(
  userId: string, 
  productId: string, 
  paymentMethod: string, 
  session: ClientSession | null = null // <-- QUAN TRỌNG
) { 
    
    // 1. Tìm product (có truyền session)
    const product = await this.designModel.findById(productId).session(session);

    // Validate
    if (!product) {
        throw new Error(`Product not found with id: ${productId}`);
    }

    // 2. Tạo Order (Dùng cú pháp mảng để hỗ trợ session)
    const [order] = await this.orderModel.create([{
      userId: new Types.ObjectId(userId),
      items: [{
          productId: new Types.ObjectId(productId),
          price: product.currentPrice || 0, // Giá lấy từ DB snapshot hiện tại
          title: product.title,
          imageUrl: product.imageUrls?.[0] || ''
       }],
      totalAmount: product.currentPrice || 0,
      status: 'completed',
    }], { session }); // <-- Truyền option session vào đây
    

    // 3. Create purchase records
    await this.purchaseModel.create([{
          userId: new Types.ObjectId(userId),
          productId: new Types.ObjectId(productId),
          orderId: order._id,
    }], { session }); // <-- Truyền option session vào đây

    // 4. Update Design stats
    // Đây là điểm quan trọng tránh WriteConflict:
    // Vì update này nằm cùng session với update status ở Cronjob, 
    // MongoDB sẽ xếp hàng xử lý gọn gàng.
    await this.designModel.findByIdAndUpdate(productId, {
          $inc: { purchaseCount: 1, totalEarning: product.currentPrice || 0 }
    }).session(session); // <-- Truyền session vào đây

     await this.notificationService.create({
                    userId: userId, 
                    title: 'You won the auction',
                    message: `You won "${product.title}" for ${product.currentPrice}VND`,
                    type: NotificationType.AUCTION,
                    thumbnail: product.imageUrls?.[0] || '',
                    // link: `/dashboard/analytics` //,
                    relatedEntityId: (order._id as Types.ObjectId).toString(),
                });
     await this.notificationService.create({
                    userId: product.designerId.toString(), // ID của Designer
                    title: 'Item Sold!',
                    message: `You sold "${product.title}" for ${product.currentPrice}VND`,
                    type: NotificationType.ORDER_PURCHASED, // Enum bạn đã định nghĩa
                    thumbnail: product.imageUrls?.[0] || '', // Lấy ảnh đầu tiên làm thumbnail
                    // link: `/dashboard/analytics` // (Optional) Link tới trang quản lý doanh thu của designer
                    relatedEntityId: (order._id as Types.ObjectId).toString(),
                });
            

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

  async getMyOrders(userId: string, query: GetMyOrdersDto) {
  const userObjectId = new Types.ObjectId(userId);
  
  // Destructure các field từ query object, gán giá trị mặc định nếu cần
  const { search, page = 1, limit = 10, status } = query;

  const pipeline: PipelineStage[] = [
    // 1. Chỉ lấy order của user đó
    { $match: { userId: userObjectId } },
  ];

  // 2. Xử lý Search (Nếu có)
  if (search && search.trim() !== '') {
    const searchText = search.trim();
    pipeline.push(
      {
        // Convert _id sang string để search regex
        $addFields: {
           orderIdStr: { $toString: '$_id' }
        }
      },
      {
        $match: {
          $or: [
            // Tìm theo Order ID
            { orderIdStr: { $regex: searchText, $options: 'i' } },
            // Tìm theo tên sản phẩm trong mảng items
            { 'items.title': { $regex: searchText, $options: 'i' } },
          ],
        },
      }
    );
  }

  // 3. Xử lý Filter Status (Ví dụ mở rộng)
  if (status && status !== 'all') {
    pipeline.push({
      $match: { status: status }
    });
  }

  // 4. Sort đơn mới nhất lên đầu
  pipeline.push({ $sort: { createdAt: -1 } });

  // 5. Xử lý Phân trang (Pagination) - Mở rộng thêm
  // Lưu ý: Nếu dùng phân trang thì nên dùng $facet để lấy cả tổng số lượng
  const skip = (page - 1) * limit;
  
  pipeline.push({
    $facet: {
      data: [
        { $skip: skip },
        { $limit: limit }
      ],
      totalCount: [
        { $count: 'count' }
      ]
    }
  });

  // Execute
  const result = await this.orderModel.aggregate(pipeline);
  
  // Format lại kết quả trả về do dùng $facet
  const data = result[0].data;
  const total = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}
}