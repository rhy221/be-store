import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Collection, CollectionSchema } from '@app/database/schemas/collection.schema';
import { Design, DesignSchema } from '@app/database/schemas/design.schema';

@Module({
  imports: [MongooseModule.forFeature([
    {name: Collection.name, schema: CollectionSchema},
    {name: Design.name, schema: DesignSchema},
  ])],
  controllers: [CollectionController],
  providers: [CollectionService]
})
export class CollectionModule {}
