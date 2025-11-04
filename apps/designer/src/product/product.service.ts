import { Design } from '@app/database/schemas/design.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDesignDto, DesignDto } from './product.dto';
import {  Comment } from '@app/database/schemas/comment.schema';
import { Category } from '@app/database/schemas/category.schema';

@Injectable()
export class ProductService {

    constructor(@InjectModel(Design.name) private readonly designModel: Model<Design>,
                @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
                @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
){}
    
    async create(dto: CreateDesignDto, designerId: string, imagesUrl: string[], fileUrl: string) {
        return await this.designModel.create({...dto, designerId, imagesUrl, fileUrl, viewCount: 0, likeCount: 0, state: 'approved'})
    }

    async get(designerId: string) {
        return await this.designModel.find({designerId: designerId});
    }

    async getOneById(id: string) {
        return await this.designModel.findOne({_id: id});
    }

    async updateOneById(id: string, dto: DesignDto) {
        return await this.designModel.findOneAndUpdate({id: id}, {...dto}, {new: true});
    }

    async getOneCommentsById(id: string) {
        return await this.commentModel.find({designId: id});
    }

    async getCategories() {
        return await this.categoryModel.find();
    }

    async getPurchasedHistory(designerId: string) {

    }
}
