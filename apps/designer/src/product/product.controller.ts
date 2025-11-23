import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CreateCollectionDto, CreateDesignDto, FollowDesingerDto, LikeDesignDto, ProductQueryDto, UpdateCollectionDto, UpdateProductDto } from './product.dto';
import { StorageService } from '@app/storage/storage.service';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { ConvertService } from '@app/convert';
import { OptionalJwtGuard } from '@app/common/guards/optional-jwt.guard';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService,
                private readonly storageService: StorageService,
                private readonly convertService: ConvertService,
    ){}

    @UseGuards(JwtGuard)
    @Get()
    async getAll(@Req() req) {
        const designerId = req.user.userId;
        return await this.productService.get(designerId);
    }

    @UseGuards(OptionalJwtGuard)
    @Get('detail/:id') 
    async get(@Param('id') id: string, @Req() req) {
        const userId = req?.user?.userId;
        console.log(userId);
        return await this.productService.getOneById(id, userId);
    }

    @UseGuards(JwtGuard)
    @UseInterceptors(FileFieldsInterceptor([
    { name: 'images' },
    { name: 'models'},
    ],
    {
        // storage: memoryStorage()
    // storage: diskStorage({
    //   destination: (req, file, cb) => {
    //     let uploadPath = '';

    //   if (file.fieldname === 'models') {
    //     uploadPath = join(process.cwd(), 'uploads', 'models');
    //     console.log('Saving model to:', uploadPath);
    //   } else if (file.fieldname === 'images') {
    //     uploadPath = join(process.cwd(), 'uploads', 'images'); // Ví dụ: lưu images vào 'uploads/images'
    //     console.log('Saving image to:', uploadPath);
    //   } else {
    //     return cb(new Error('Invalid field name'), "");
    //   }

    //   cb(null, uploadPath);
    //   },
    //   filename: (req, file, cb) => {
    //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    //     cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
    //   },
      
    // }),
    // fileFilter: (req, file, cb) => {
    //     if (file.fieldname === 'models' && extname(file.originalname).toLowerCase() !== '.fbx') {
    //         console.log(file.originalname);
    //         return cb(new BadRequestException('Only .fbx allowed for models'), false);
    //     }
    //                 console.log(file.originalname);

    //     cb(null, true); 
    //   },
  }
    ))
    @Post('create') 
    async create(
    @UploadedFiles() files: {
        images?: Express.Multer.File[];
        models?: Express.Multer.File[];
    }, 
    @Body() body: CreateDesignDto,
    @Req() req 
    ) {
        if(!files.images)
            throw new BadRequestException("image is required")
        if(!files.models)
            throw new BadRequestException("model is required")
        console.log(files.models.length);
        const designerId = req.user.userId;
        // console.log(files.models[0].path);
        // const path = await this.convertService.convertFbxToGltf(files.models[0].path, files.models[0].path.replace('.fbx', '.glb'));
        // console.log(path);
        // const glbFile = await this.convertService.getFileFromPath(path);
        // if(glbFile)
        //     console.log("convert successful")
        // if(!files.models[0].buffer)
        //     console.log("buffer error")
                            // console.log(files.models[0].originalname)

        const modelsRes = await this.storageService.upload3d(files.models[0], { folder: '3d_models'});
                    console.log("upload model")

        // const displayModelRes = await this.storageService.upload3d(glbFile, { folder: '3d_models', byPath: true });
        //             console.log("upload display model")

        const imgsres = await this.storageService.uploadMany(files.images, { folder: 'my_app_images', concurrency: 3});
            console.log("upload images")

        console.log("upload");
        return await this.productService.create(
            body, 
            designerId, 
            [...imgsres.results.map((res) => res.url!)],
            // [...modelsRes.results.map((res) => res.url!)],
            [
              {
                publicId: modelsRes.key,
                format: modelsRes.format || "",
                size: modelsRes.bytes || 0,
              }
            ],
            ""
            // modelsRes.url!
            // displayModelRes.url!
            // [],
            // ""
            );
        

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

    @Get('gallery')
    async getGalleryItems() {
        return this.productService.getGalleryItems();
    }
    
     @Get('store')
    async getStoreItems() {
        return this.productService.getStoreItems();
    }

    @UseGuards(JwtGuard)
    @Post('like')
    async likeProduct(@Req() req, @Body() dto: LikeDesignDto) {
      return this.productService.likeDesign(req.user.userId, dto.designId);
    }

    @UseGuards(JwtGuard)
    @Get('liked/all')
    async getLikedProducts(@Req() req) {
      return this.productService.getLikedDesigns(req.user.userId);
    }

    @UseGuards(JwtGuard)
    @Post('follow-designer')
    async followSeller(@Req() req, @Body() dto: FollowDesingerDto) {
      return this.productService.followDesigner(req.user.userId, dto.designerId);
    }

    @UseGuards(JwtGuard)
    @Get('followed-designers/all')
    async getFollowedSellers(@Req() req) {
      return this.productService.getFollowedDesigners(req.user.userId);
    }

    @Get()
  async getProducts(@Query() query: ProductQueryDto, @Req() req) {
    const userId = req.user?.userId;
    return this.productService.getProducts(query, userId);
  }

  @Get('my-products')
  @UseGuards(JwtGuard)
  async getMyProducts(@Query() query: ProductQueryDto, @Req() req) {
    return this.productService.getMyProducts(req.user.userId, query);
  }

//   @Get(':id')
//   async getProductById(@Param('id') id: string, @Request() req) {
//     const userId = req.user?.userId;
//     return this.productService.getProductById(id, userId);
//   }

//   @Post()
//   @UseGuards(JwtAuthGuard)
//   async createProduct(@Request() req, @Body() createProductDto: CreateProductDto) {
//     return this.productService.createProduct(req.user.userId, createProductDto);
//   }

  @Put(':id')
  @UseGuards(JwtGuard)
  async updateProduct(
    @Req() req,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productService.updateProduct(req.user.userId, id, updateProductDto);
  }

   @Post(':id/collections/add')
  @UseGuards(JwtGuard)
  async addToCollections(
    @Req() req,
    @Param('id') id: string,
    @Body() body: { collectionIds: string[] }
  ) {
    // return this.productService.addToCollections(req.user.userId, id, body.collectionIds);
  }

  @Post(':id/collections/remove')
  @UseGuards(JwtGuard)
  async removeFromCollections(
    @Req() req,
    @Param('id') id: string,
    @Body() body: { collectionIds: string[] }
  ) {
    // return this.productService.removeFromCollections(req.user.userId, id, body.collectionIds);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async deleteProduct(@Req() req, @Param('id') id: string) {
    return this.productService.deleteProduct(req.user.userId, id);
  }

  @Get('my-collections')
  async getMyCollections(@Req() req) {
    return this.productService.getMyCollections(req.user.userId);
  }

  @Get('colletions/:id')
  async getCollectionById(@Param('id') id: string) {
    return this.productService.getCollectionById(id);
  }

  @Post('collections')
  async createCollection(@Req() req, @Body() createCollectionDto: CreateCollectionDto) {
    return this.productService.createCollection(req.user.userId, createCollectionDto);
  }

  @Put('collections/:id')
  async updateCollection(
    @Req() req,
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto
  ) {
    return this.productService.updateCollection(req.user.userId, id, updateCollectionDto);
  }

  @Delete('collections/:id')
  async deleteCollection(@Req() req, @Param('id') id: string) {
    return this.productService.deleteCollection(req.user.userId, id);
  }
   
}
