import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { RatingService } from './rating.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { CreateRatingDto, UpdateRatingDto } from './rating.dto';


@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

   @Post()
  @UseGuards(JwtGuard)
  async createRating(@Request() req, @Body() createRatingDto: CreateRatingDto) {
    return this.ratingService.createRating(req.user.userId, createRatingDto);
  }

  @Put(':productId')
  @UseGuards(JwtGuard)
  async updateRating(
    @Request() req,
    @Param('productId') productId: string,
    @Body() updateRatingDto: UpdateRatingDto
  ) {
    return this.ratingService.updateRating(req.user.userId, productId, updateRatingDto);
  }

  @Delete(':productId')
  @UseGuards(JwtGuard)
  async deleteRating(@Request() req, @Param('productId') productId: string) {
    return this.ratingService.deleteRating(req.user.userId, productId);
  }

  @Get('product/:productId')
  async getProductRatings(
    @Param('productId') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.ratingService.getProductRatings(productId, page, limit);
  }

  @Get('product/:productId/distribution')
  async getRatingDistribution(@Param('productId') productId: string) {
    return this.ratingService.getRatingDistribution(productId);
  }

  @Get('my-rating/:productId')
  @UseGuards(JwtGuard)
  async getUserRating(@Request() req, @Param('productId') productId: string) {
    return this.ratingService.getUserRating(req.user.userId, productId);
  }
}