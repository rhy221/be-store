import { Collection } from '@app/database/schemas/collection.schema';
import { Design } from '@app/database/schemas/design.schema';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCollectionDto, UpdateCollectionDto } from './collection.dto';


@Injectable()
export class CollectionService {
  constructor(
    @InjectModel(Collection.name) private collectionModel: Model<Collection>,
    @InjectModel(Design.name) private productModel: Model<Design>,
  ) {}

  async createCollection(userId: string, createCollectionDto: CreateCollectionDto) {
    const collection = await this.collectionModel.create({
      ...createCollectionDto,
      createdBy: userId,
    });
    return collection;
  }

  async updateCollection(userId: string, collectionId: string, updateCollectionDto: UpdateCollectionDto) {
    const collection = await this.collectionModel.findOne({ _id: collectionId, isDeleted: false });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only update your own collections');
    }

    Object.assign(collection, updateCollectionDto);
    await collection.save();
    return collection;
  }

  async deleteCollection(userId: string, collectionId: string) {
    const collection = await this.collectionModel.findOne({ _id: collectionId, isDeleted: false });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own collections');
    }

    // Soft delete
    collection.isDeleted = true;
    collection.deletedAt = new Date();
    await collection.save();

    // Remove collection from all products
    await this.productModel.updateMany(
      { collectionIds: collectionId },
      { $pull: { collectionIds: new Types.ObjectId(collectionId) } }
    );

    return { message: 'Collection deleted successfully' };
  }

  async getMyCollections(userId: string, includeDeleted: boolean = false) {
    const filter: any = { createdBy: userId };
    if (!includeDeleted) filter.isDeleted = false;

    const collections = await this.collectionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();

    const collectionsWithCount = await Promise.all(
      collections.map(async (collection) => {
        const count = await this.productModel.countDocuments({ 
          collectionIds: collection._id,
          isDeleted: false 
        });
        return {
          ...collection.toJSON(),
          productCount: count,
        };
      })
    );

    return collectionsWithCount;
  }

  async getCollectionById(collectionId: string) {
    const collection = await this.collectionModel.findOne({ 
      _id: collectionId, 
      isDeleted: false 
    }).exec();
    
    if (!collection) throw new NotFoundException('Collection not found');
    
    const products = await this.productModel
      .find({ collectionIds: collectionId, isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();

    return {
      ...collection.toJSON(),
      products,
      productCount: products.length,
    };
  }

  async getCollectionProducts(collectionId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find({ collectionIds: collectionId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments({ collectionIds: collectionId, isDeleted: false }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}