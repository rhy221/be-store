import { Body, Controller, Get, Param, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CreateDesignDto } from './product.dto';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService){}

    @UseGuards(JwtGuard)
    @Get()
    async getAll(@Req() req) {
        const designerId = req.user.userId;
        return await this.productService.get(designerId);
    }

    @UseGuards(JwtGuard)
    @Get(':id') 
    async get(@Param('id') id: string) {
        return await this.productService.getOneById(id);
    }

    @UseGuards(JwtGuard)
    @UseInterceptors(FileFieldsInterceptor([
    { name: 'images' },
    { name: 'model', maxCount: 1 },
    ]))
    @Post('create') 
    async create(
    @UploadedFiles() files: {
        images?: Express.Multer.File[];
        model?: Express.Multer.File;
    }, 
    @Body() body: CreateDesignDto,
    @Req() req 
    ) {
        if(files.images)
            console.log(files.images.length)
        if(files.model)
            console.log("model")
        const designerId = req.user.userId
        return await this.productService.create(
            body, 
            designerId, 
            ["https://picsum.photos/800/600", "https://picsum.photos/800/600", "https://picsum.photos/800/600"],
        "https://picsum.photos/800/600");
        return {
            message: "success"
        }

    }

    @UseGuards(JwtGuard)
    @Get(':id/comments') 
    async getOneComments(@Param('id') id: string) {
        return await this.productService.getOneCommentsById(id);
    }

    @Get('list/categories')
    async getCategories() {
        return await this.productService.getCategories();
    }

   
}
