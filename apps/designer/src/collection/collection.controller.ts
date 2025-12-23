import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { CreateCollectionDto, UpdateCollectionDto } from './collection.dto';

@Controller('collections')
@UseGuards(JwtGuard)
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get('my-collections')
  async getMyCollections(@Request() req, @Query('includeDeleted') includeDeleted?: boolean) {
    return this.collectionService.getMyCollections(req.user.userId, includeDeleted);
  }

  @Get(':id')
  async getCollectionById(@Param('id') id: string) {
    return this.collectionService.getCollectionById(id);
  }

  @Get(':id/products')
  async getCollectionProducts(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.collectionService.getCollectionProducts(id, page, limit);
  }

  @Post()
  async createCollection(@Request() req, @Body() createCollectionDto: CreateCollectionDto) {
    return this.collectionService.createCollection(req.user.userId, createCollectionDto);
  }

  @Put(':id')
  async updateCollection(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto
  ) {
    return this.collectionService.updateCollection(req.user.userId, id, updateCollectionDto);
  }

  @Delete(':id')
  async deleteCollection(@Request() req, @Param('id') id: string) {
    return this.collectionService.deleteCollection(req.user.userId, id);
  }
}