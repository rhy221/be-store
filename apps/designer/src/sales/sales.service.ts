import { Order } from '@app/database/schemas/order.shema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { GetSalesDto } from './sales.dto';

@Injectable()
export class SalesService {

    constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  // async getSellerSales(designerId: string, query: GetSalesDto) {
  //   const start = new Date(query.startDate);
  //   const end = new Date(query.endDate);
  //   // Đảm bảo lấy hết ngày cuối cùng
  //   end.setHours(23, 59, 59, 999); 

  //   const designerObjectId = new Types.ObjectId(designerId);

  //   const pipeline: PipelineStage[] = [
  //     // 1. Lọc các Order trong khoảng thời gian và (tùy chọn) trạng thái đã thanh toán
  //     {
  //       $match: {
  //         createdAt: { $gte: start, $lte: end },
  //         // status: 'completed' // Uncomment nếu chỉ tính đơn thành công
  //       },
  //     },
  //     // 2. Tách mảng items ra để xử lý từng món hàng
  //     { $unwind: '$items' },
  //     // 3. Join với bảng Design để lấy designerId của sản phẩm đó
  //     {
  //       $lookup: {
  //         from: 'designs', // Tên collection trong MongoDB (thường là số nhiều chữ thường)
  //         localField: 'items.productId',
  //         foreignField: '_id',
  //         as: 'productInfo',
  //       },
  //     },
  //     // 4. Unwind mảng productInfo (vì lookup trả về mảng)
  //     { $unwind: '$productInfo' },
  //     // 5. QUAN TRỌNG: Chỉ giữ lại các item thuộc về Designer đang request
  //     {
  //       $match: {
  //         'productInfo.designerId': designerObjectId,
  //       },
  //     },
  //     // 6. Nhóm lại theo Order để trả về cấu trúc danh sách
  //     // Đồng thời dùng $facet để tính toán song song: Tổng quan & Chi tiết
  //     {
  //       $facet: {
  //         // A. Tính tổng số liệu (Summary)
  //         summary: [
  //           {
  //             $group: {
  //               _id: null,
  //               totalItemsSold: { $sum: 1 }, // Đếm tổng số item bán được
  //               totalRevenue: { $sum: '$items.price' }, // Tổng tiền của Seller
  //             },
  //           },
  //         ],
  //         // B. Danh sách chi tiết các order (Details)
  //         orders: [
  //           {
  //             $group: {
  //               _id: '$_id', // Group lại theo Order ID
  //               orderDate: { $first: '$createdAt' },
  //               buyerId: { $first: '$userId' },
  //               // Tính tổng tiền của riêng Seller trong order này
  //               sellerOrderTotal: { $sum: '$items.price' }, 
  //               // Danh sách các item của Seller trong order này
  //               items: {
  //                 $push: {
  //                   title: '$items.title',
  //                   price: '$items.price',
  //                   imageUrl: '$items.imageUrl',
  //                   productId: '$items.productId',
  //                 },
  //               },
  //             },
  //           },
  //           { $sort: { orderDate: -1 } }, // Sắp xếp mới nhất trước
  //         ],
  //       },
  //     },
  //   ];

  //   const result = await this.orderModel.aggregate(pipeline);
    
  //   // Format lại dữ liệu trả về cho gọn
  //   const stats = result[0];
  //   return {
  //     summary: stats.summary[0] || { totalItemsSold: 0, totalRevenue: 0 },
  //     orders: stats.orders,
  //   };
  // }

  async getSellerSales(designerId: string, query: GetSalesDto) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    end.setHours(23, 59, 59, 999);

    const designerObjectId = new Types.ObjectId(designerId);
    
    // Chuẩn bị filter bổ sung
    const typeFilter = query.type && query.type !== 'all' ? query.type : null;
    const searchText = query.search ? query.search.trim() : null;

    const pipeline: PipelineStage[] = [
      // 1. Lọc Time Range
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      // 2. Unwind items
      { $unwind: '$items' },
      // 3. Lookup Design Info
      {
        $lookup: {
          from: 'designs', 
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      
      // 4. Lọc Item của Designer
      {
        $match: {
          'productInfo.designerId': designerObjectId,
        },
      },

      // 5. [NEW] Filter by Type (Store/Auction)
      // Giả định field type nằm trong 'designs'. Nếu nằm trong 'items', sửa thành 'items.type'
      ...(typeFilter
        ? [
            {
              $match: {
                'productInfo.type': typeFilter, 
              },
            },
          ]
        : []),

      // 6. [NEW] Filter by Search Keyword (Title or Order ID)
      ...(searchText
        ? [
            {
              // Chúng ta cần convert _id sang string để search regex (nếu muốn search một phần ID)
              // Hoặc chỉ search items.title nếu search ID quá phức tạp về performance
              $addFields: {
                orderIdStr: { $toString: '$_id' } 
              }
            },
            {
              $match: {
                $or: [
                  // Tìm theo tên sản phẩm (Case insensitive)
                  { 'items.title': { $regex: searchText, $options: 'i' } },
                  // Tìm theo Order ID
                  { 'orderIdStr': { $regex: searchText, $options: 'i' } }
                ],
              },
            },
          ]
        : []),

      // 7. Group & Facet (Giữ nguyên logic cũ)
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalItemsSold: { $sum: 1 },
                totalRevenue: { $sum: '$items.price' },
              },
            },
          ],
          orders: [
            {
              $group: {
                _id: '$_id',
                orderDate: { $first: '$createdAt' },
                buyerId: { $first: '$userId' },
                sellerOrderTotal: { $sum: '$items.price' },
                items: {
                  $push: {
                    title: '$items.title',
                    price: '$items.price',
                    imageUrl: '$items.imageUrl',
                    productId: '$items.productId',
                  },
                },
              },
            },
            { $sort: { orderDate: -1 } },
          ],
        },
      },
    ];

    const result = await this.orderModel.aggregate(pipeline);

    const stats = result[0];
    return {
      summary: stats.summary[0] || { totalItemsSold: 0, totalRevenue: 0 },
      orders: stats.orders,
    };
}
}
