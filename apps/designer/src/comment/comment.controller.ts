import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { CreateCommentDto, UpdateCommentDto } from './comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @UseGuards(JwtGuard)
  async createComment(@Request() req, @Body() createCommentDto: CreateCommentDto) {
    return this.commentService.createComment(req.user.userId, createCommentDto);
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  async updateComment(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto
  ) {
    return this.commentService.updateComment(req.user.userId, id, updateCommentDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async deleteComment(@Request() req, @Param('id') id: string) {
    return this.commentService.deleteComment(req.user.userId, id);
  }

  @Get('product/:productId')
  async getProductComments(
    @Param('productId') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.commentService.getProductComments(productId, page, limit);
  }
}