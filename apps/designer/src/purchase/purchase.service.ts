import { Design } from '@app/database/schemas/design.schema';
import { Purchase } from '@app/database/schemas/purchase.schema';
import { StorageService } from '@app/storage';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { GetPurchasesDto } from './purchase.dto';


@Injectable()
export class PurchaseService {
  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<Purchase>,
    @InjectModel(Design.name) private productModel: Model<Design>,
    private storageService: StorageService,
  ) {}



// async getPurchasedProducts(userId: string) {
//   return this.purchaseModel.aggregate([
//     // 1. Tìm các lượt mua hàng của user hiện tại
//     { 
//       $match: { 
//         userId: new Types.ObjectId(userId) 
//       } 
//     },

//     // 2. Sắp xếp mới nhất trước (tương đương .sort({ createdAt: -1 }))
//     { 
//       $sort: { createdAt: -1 } 
//     },

//     // 3. Join với bảng 'designs' để lấy thông tin sản phẩm
//     {
//       $lookup: {
//         from: 'designs',          // Tên collection trong DB (check @Schema)
//         localField: 'productId',  // Field trong Purchase
//         foreignField: '_id',      // Field trong Design
//         as: 'product'
//       }
//     },
//     // Unwind để biến mảng 'product' thành object (vì 1 purchase chỉ có 1 product)
//     { 
//       $unwind: '$product' 
//     },

//     // 4. Join với 'designerProfiles' để lấy tên Designer
//     // Logic: Lấy product.designerId (từ bước 3) so khớp với designerProfiles.userId
//     {
//       $lookup: {
//         from: 'designerProfiles',
//         let: { dId: '$product.designerId' }, // Lưu designerId vào biến tạm $$dId
//         pipeline: [
//           {
//             $match: {
//               $expr: { $eq: ['$userId', '$$dId'] } // So sánh userId == designerId
//             }
//           },
//           // Chỉ lấy field 'name' cho nhẹ
//           { 
//             $project: { name: 1, _id: 0 } 
//           }
//         ],
//         as: 'designerInfo'
//       }
//     },
//     // Unwind để lấy object ra khỏi mảng
//     {
//       $unwind: {
//         path: '$designerInfo',
//         preserveNullAndEmptyArrays: true // Giữ lại record dù không tìm thấy designer
//       }
//     },

//     // 5. Định dạng dữ liệu trả về (Projection)
//     {
//       $project: {
//         _id: 1,
//         orderId: 1,
//         downloadCount: 1,
//         lastDownloadAt: 1,
//         createdAt: 1,
//         // Gom nhóm thông tin product
//         product: {
//           _id: '$product._id',
//           title: '$product.title',
//           imageUrls: '$product.imageUrls',
//           designerId: '$product.designerId',
//           // Lấy name từ kết quả lookup bước 4 đưa vào đây
//           designerName: '$designerInfo.name' 
//         }
//       }
//     }
//   ]).exec();
// }

async getPurchasedProducts(userId: string, query: GetPurchasesDto) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const userObjectId = new Types.ObjectId(userId);

    // Pipeline cơ bản (Lookup product trước để search)
    const pipeline: PipelineStage[] = [
      // 1. Lọc theo user
      { $match: { userId: userObjectId } },

      // 2. Lookup Product
      {
        $lookup: {
          from: 'designs',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },

      // 3. Lookup Designer Profile
      {
        $lookup: {
          from: 'designerProfiles',
          let: { dId: '$product.designerId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$userId', '$$dId'] } } },
            { $project: { name: 1, _id: 0 } },
          ],
          as: 'designerInfo',
        },
      },
      {
        $unwind: {
          path: '$designerInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // 4. [NEW] Thêm logic Search (nếu có)
    if (search && search.trim() !== '') {
      pipeline.push({
        $match: {
          'product.title': { $regex: search.trim(), $options: 'i' }, // Tìm theo tên sản phẩm (case-insensitive)
        },
      });
    }

    // 5. Sort mới nhất
    pipeline.push({ $sort: { createdAt: -1 } });

    // 6. [NEW] Facet để phân trang + đếm tổng
    pipeline.push({
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              orderId: 1,
              downloadCount: 1,
              lastDownloadAt: 1,
              createdAt: 1,
              product: {
                _id: '$product._id',
                title: '$product.title',
                imageUrls: '$product.imageUrls',
                designerId: '$product.designerId',
                designerName: '$designerInfo.name',
              },
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    });

    const result = await this.purchaseModel.aggregate(pipeline);
    const data = result[0].data;
    const total = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async downloadProduct(userId: string, productId: string) {
    const purchase = await this.purchaseModel
      .findOne({ userId: new Types.ObjectId(userId), productId: new Types.ObjectId(productId) })
      .populate('productId')
      .exec();

    if (!purchase) {
      throw new NotFoundException('You have not purchased this product');
    }

    // Increment download count
    purchase.downloadCount += 1;
    purchase.lastDownloadAt = new Date();
    await purchase.save();

    const product = purchase.productId as any;

    const url = this.storageService.generateSignedUrl(product.modelFiles[0].publicId,product.modelFiles[0].format, "raw");

    return {
      downloadUrl: url,
      fileName: `${product.title}.${product.modelFiles[0].format}`,
      fileSize: product.modelFiles[0].size,
    };
  }

  async checkPurchaseStatus(userId: string, productId: string) {
    const purchase = await this.purchaseModel.findOne({ userId: new Types.ObjectId(userId), productId: new Types.ObjectId(productId) });
    return { isPurchased: !!purchase };
  }
}