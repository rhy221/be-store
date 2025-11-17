import { Body, Controller, Get, Param, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CreateDesignDto } from './product.dto';
import { StorageService } from '@app/storage/storage.service';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService,
                private readonly storageService: StorageService
    ){}

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
    { name: 'models', maxCount: 1 },
    ]))
    @Post('create') 
    async create(
    @UploadedFiles() files: {
        images?: Express.Multer.File[];
        models?: Express.Multer.File[];
    }, 
    @Body() body: CreateDesignDto,
    @Req() req 
    ) {
        if(files.images)
            console.log(files.images.length)
        if(files.models)
            console.log(files.models.length)
        const designerId = req.user.userId
        const res = await this.storageService.upload(files.images?.[0]!, { folder: 'my_app_images' });
        console.log("upload");
        return await this.productService.create(
            body, 
            designerId, 
            [res.url ?? "https://picsum.photos/800/600"],
        []);
        

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
