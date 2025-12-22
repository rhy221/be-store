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

//   async getSellerSales(designerId: string, query: GetSalesDto) {
//     const start = new Date(query.startDate);
//     const end = new Date(query.endDate);
//     end.setHours(23, 59, 59, 999);

//     const designerObjectId = new Types.ObjectId(designerId);
    
//     // Chuẩn bị filter bổ sung
//     const typeFilter = query.type && query.type !== 'all' ? query.type : null;
//     const searchText = query.search ? query.search.trim() : null;

//     const pipeline: PipelineStage[] = [
//       // 1. Lọc Time Range
//       {
//         $match: {
//           createdAt: { $gte: start, $lte: end },
//         },
//       },
//       // 2. Unwind items
//       { $unwind: '$items' },
//       // 3. Lookup Design Info
//       {
//         $lookup: {
//           from: 'designs', 
//           localField: 'items.productId',
//           foreignField: '_id',
//           as: 'productInfo',
//         },
//       },
//       { $unwind: '$productInfo' },
      
//       // 4. Lọc Item của Designer
//       {
//         $match: {
//           'productInfo.designerId': designerObjectId,
//         },
//       },

//       // 5. [NEW] Filter by Type (Store/Auction)
//       // Giả định field type nằm trong 'designs'. Nếu nằm trong 'items', sửa thành 'items.type'
//       ...(typeFilter
//         ? [
//             {
//               $match: {
//                 'productInfo.type': typeFilter, 
//               },
//             },
//           ]
//         : []),

//       // 6. [NEW] Filter by Search Keyword (Title or Order ID)
//       ...(searchText
//         ? [
//             {
//               // Chúng ta cần convert _id sang string để search regex (nếu muốn search một phần ID)
//               // Hoặc chỉ search items.title nếu search ID quá phức tạp về performance
//               $addFields: {
//                 orderIdStr: { $toString: '$_id' } 
//               }
//             },
//             {
//               $match: {
//                 $or: [
//                   // Tìm theo tên sản phẩm (Case insensitive)
//                   { 'items.title': { $regex: searchText, $options: 'i' } },
//                   // Tìm theo Order ID
//                   { 'orderIdStr': { $regex: searchText, $options: 'i' } }
//                 ],
//               },
//             },
//           ]
//         : []),

//       // 7. Group & Facet (Giữ nguyên logic cũ)
//       {
//         $facet: {
//           summary: [
//             {
//               $group: {
//                 _id: null,
//                 totalItemsSold: { $sum: 1 },
//                 totalRevenue: { $sum: '$items.price' },
//               },
//             },
//           ],
//           orders: [
//             {
//               $group: {
//                 _id: '$_id',
//                 orderDate: { $first: '$createdAt' },
//                 buyerId: { $first: '$userId' },
//                 sellerOrderTotal: { $sum: '$items.price' },
//                 items: {
//                   $push: {
//                     title: '$items.title',
//                     price: '$items.price',
//                     imageUrl: '$items.imageUrl',
//                     productId: '$items.productId',
//                   },
//                 },
//               },
//             },
//             { $sort: { orderDate: -1 } },
//           ],
//         },
//       },
//     ];

//     const result = await this.orderModel.aggregate(pipeline);

//     const stats = result[0];
//     return {
//       summary: stats.summary[0] || { totalItemsSold: 0, totalRevenue: 0 },
//       orders: stats.orders,
//     };
// }

async getSellerSales(designerId: string, query: GetSalesDto) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    end.setHours(23, 59, 59, 999);

    const designerObjectId = new Types.ObjectId(designerId);
    
    const typeFilter = query.type && query.type !== 'all' ? query.type : null;
    const searchText = query.search ? query.search.trim() : null;
    
    // Pagination params
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline: PipelineStage[] = [
      // ... (Các bước 1->6 giữ nguyên như cũ: Match Time, Unwind, Lookup, Filter Designer, Filter Type, Search) ...
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'designs', 
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $match: {
          'productInfo.designerId': designerObjectId,
        },
      },
      ...(typeFilter
        ? [{ $match: { 'productInfo.type': typeFilter } }]
        : []),
      ...(searchText
        ? [
            { $addFields: { orderIdStr: { $toString: '$_id' } } },
            {
              $match: {
                $or: [
                  { 'items.title': { $regex: searchText, $options: 'i' } },
                  { 'orderIdStr': { $regex: searchText, $options: 'i' } }
                ],
              },
            },
          ]
        : []),

      // --- BƯỚC 7: GROUP & FACET (CẬP NHẬT PHÂN TRANG) ---
      // Trước khi phân trang, ta cần group lại thành từng đơn hàng để đếm đúng số lượng đơn (chứ không phải số lượng items lẻ)
      {
         $group: {
            _id: '$_id', // Group by Order ID
            orderDate: { $first: '$createdAt' },
            sellerOrderTotal: { $sum: '$items.price' },
            items: {
                $push: {
                    title: '$items.title',
                    price: '$items.price',
                    imageUrl: '$items.imageUrl',
                    productId: '$items.productId',
                },
            },
            // Để tính tổng revenue của toàn bộ (không bị ảnh hưởng bởi pagination), ta cần 1 bước tính toán riêng hoặc chấp nhận tính trên FE dựa trên data trả về (nhưng nếu phân trang thì FE không tính tổng all được).
            // Cách tốt nhất: Tính Total Revenue ngay trong facet
         }
      },
      
      { $sort: { orderDate: -1 } }, // Sắp xếp mới nhất trước

      {
        $facet: {
          // Metadata: Đếm tổng số đơn hàng & Tổng doanh thu toàn bộ (theo bộ lọc hiện tại)
          metadata: [
             { 
               $group: {
                  _id: null,
                  total: { $sum: 1 }, // Tổng số đơn hàng
                  totalRevenue: { $sum: '$sellerOrderTotal' } // Tổng doanh thu
               }
             }
          ],
          // Data: Lấy dữ liệu theo trang
          data: [
            { $skip: skip },
            { $limit: limit },
          ],
        },
      },
    ];

    const result = await this.orderModel.aggregate(pipeline);
    
    const facetResult = result[0];
    const metadata = facetResult.metadata[0] || { total: 0, totalRevenue: 0 };
    const orders = facetResult.data || [];

    return {
      summary: {
        totalItemsSold: metadata.total, // Ở đây là Total Orders, nếu muốn Total Items sold cần group kiểu khác
        totalRevenue: metadata.totalRevenue,
      },
      orders: orders,
      meta: {
        page,
        limit,
        total: metadata.total,
        totalPages: Math.ceil(metadata.total / limit),
      }
    };
}
}
