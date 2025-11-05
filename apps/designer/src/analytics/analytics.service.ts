import { Transaction } from '@app/database/schemas/transaction.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AnalyticsService {
    constructor(@InjectModel(Transaction.name) private readonly transactionModel: Model<Transaction>) {}

 async getRevenueByWeek(month: number, year: number, designerId: string) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  // Lấy tháng trước để tính growth rate
  const lastMonthStart = new Date(year, month - 2, 1);
  const lastMonthEnd = new Date(year, month - 1, 0);

  // Aggregate cho tháng hiện tại
  const currentMonthData = await this.transactionModel.aggregate([
    {
      $match: {
        designerId: designerId,
        createdAt: { 
          $gte: startDate, 
          $lte: endDate 
        },
        totalAmount: { $gt: 0 }
      }
    },
    { $unwind: '$items' },
    {
      $addFields: {
        dayOfMonth: { $dayOfMonth: '$createdAt' },
        weekOfMonth: {
          $ceil: {
            $divide: [
              { $dayOfMonth: '$createdAt' },
              7
            ]
          }
        }
      }
    },
    {
      $group: {
        _id: {
          week: '$weekOfMonth',
          type: '$items.type'
        },
        revenue: { $sum: '$items.price' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.week',
        types: {
          $push: {
            type: '$_id.type',
            revenue: '$revenue',
            count: '$count'
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Aggregate tổng quan tháng hiện tại
  const currentMonthSummary = await this.transactionModel.aggregate([
    {
      $match: {
        designerId: designerId,
        createdAt: { 
          $gte: startDate, 
          $lte: endDate 
        },
        totalAmount: { $gt: 0 }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.type',
        totalRevenue: { $sum: '$items.price' },
        totalCount: { $sum: 1 }
      }
    }
  ]);

  // Aggregate tháng trước để tính growth rate
  const lastMonthRevenue = await this.transactionModel.aggregate([
    {
      $match: {
        designerId: designerId,
        createdAt: { 
          $gte: lastMonthStart, 
          $lte: lastMonthEnd 
        },
        totalAmount: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' }
      }
    }
  ]);

  // Process data
  const processedData = this.processRevenueData(
    currentMonthData, 
    currentMonthSummary, 
    lastMonthRevenue
  );

  return processedData;
}

private processRevenueData(weeklyData: any[], summary: any[], lastMonth: any[]) {
  // Tính tổng doanh thu và số lượng bán
  let totalRevenue = 0;
  let directSales = 0;
  let auctionSales = 0;

  summary.forEach(item => {
    totalRevenue += item.totalRevenue;
    if (item._id === 'fixed') {
      directSales = item.totalCount;
    } else if (item._id === 'auction') {
      auctionSales = item.totalCount;
    }
  });

  // Tính growth rate
  const lastMonthRevenue = lastMonth[0]?.totalRevenue || 0;
  const growthRate = lastMonthRevenue > 0
    ? parseFloat((((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(2))
    : 0;

  // Format weekly data
  const weeks = [1, 2, 3, 4, 5]; // Tuần 0-5
  const weeklyDataFormatted = weeks.map(weekNum => {
    const weekData = weeklyData.find(w => w._id === weekNum);
    
    let direct = 0;
    let auction = 0;

    if (weekData) {
      weekData.types.forEach((t: any) => {
        if (t.type === 'fixed') {
          direct = t.count;
        } else if (t.type === 'auction') {
          auction = t.count;
        }
      });
    }

    return {
      week: `Tuần ${weekNum}`,
      direct,
      auction
    };
  });

  return {
    totalRevenue,
    directSales,
    auctionSales,
    growthRate,
    weeklyData: weeklyDataFormatted
  };
}

 async getSalesHistory(
  page: number, 
  limit: number, 
  designerId: string,
  filters?: {
    startDate?: Date,
    endDate?: Date,
    type?: string // 'auction' hoặc 'direct'
  }
) {
  const skip = (page - 1) * limit;
  
  // Build match condition
  const matchCondition: any = { designerId };
  
  if (filters?.startDate || filters?.endDate) {
    matchCondition.createdAt = {};
    if (filters.startDate) matchCondition.createdAt.$gte = filters.startDate;
    if (filters.endDate) matchCondition.createdAt.$lte = filters.endDate;
  }

  if (filters?.type) {
    matchCondition['items.type'] = filters.type;
  }

  const [data, totalResult] = await Promise.all([
    this.transactionModel.aggregate([
      { $match: matchCondition },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $addFields: {
          // Đếm số items trong order
          itemCount: { $size: '$items' },
          // Format date
          orderDate: {
            $dateToString: {
              format: '%d/%m/%Y %H:%M',
              date: '$createdAt',
              timezone: 'Asia/Ho_Chi_Minh'
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          items: 1,
          totalAmount: 1,
          customerId: 1,
          createdAt: 1,
          orderDate: 1,
          itemCount: 1
        }
      }
    ]),
    
    this.transactionModel.aggregate([
      { $match: matchCondition },
      { $count: 'total' }
    ])
  ]);

  const total = totalResult[0]?.total || 0;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
}
  async getCategoryDistribution(
  designerId: string, 
  period?: { startDate: Date, endDate: Date }
) {
  const matchCondition: any = { 
    designerId,
    totalAmount: { $gt: 0 }
  };

  if (period) {
    matchCondition.createdAt = {
      $gte: period.startDate,
      $lte: period.endDate
    };
  }

  const result = await this.transactionModel.aggregate([
    { $match: matchCondition },
    { $unwind: '$items' },
    // Lookup để lấy thông tin category từ design
    {
      $lookup: {
        from: 'designs', // tên collection designs
        localField: 'items.designId',
        foreignField: '_id',
        as: 'designInfo'
      }
    },
    { $unwind: '$designInfo' },
    // Lookup để lấy tên category
    {
      $lookup: {
        from: 'categories', // tên collection categories
        localField: 'designInfo.categoryId',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    { $unwind: '$categoryInfo' },
    // Group theo category
    {
      $group: {
        _id: '$categoryInfo._id',
        categoryName: { $first: '$categoryInfo.name' },
        totalRevenue: { $sum: '$items.price' },
        itemCount: { $sum: 1 },
        orderCount: { $addToSet: '$_id' }, // Đếm số order unique
        designCount: { $addToSet: '$items.designId' } // Đếm số design unique
      }
    },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        categoryName: 1,
        revenue: '$totalRevenue',
        itemCount: 1,
        orderCount: { $size: '$orderCount' },
        designCount: { $size: '$designCount' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  const totalRevenue = result.reduce((sum, item) => sum + item.revenue, 0);
  const totalItems = result.reduce((sum, item) => sum + item.itemCount, 0);

  return result.map(item => ({
    ...item,
    percentage: totalRevenue > 0 
      ? parseFloat(((item.revenue / totalRevenue) * 100).toFixed(2))
      : 0,
    itemPercentage: totalItems > 0
      ? parseFloat(((item.itemCount / totalItems) * 100).toFixed(2))
      : 0
  }));
}
  private formatWeeklyData(aggregateResult, startDate, endDate) {
    // Logic để map week number sang Week 1-5 của tháng
    // ...
  }
}
