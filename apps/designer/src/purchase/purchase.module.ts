import { Module } from '@nestjs/common';
import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Purchase, PurchaseSchema } from '@app/database/schemas/purchase.schema';
import { Design, DesignSchema } from '@app/database/schemas/design.schema';
import { StorageModule, StorageService } from '@app/storage';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Purchase.name, schema: PurchaseSchema },
      { name: Design.name, schema: DesignSchema },
    ]),
    StorageModule,
  ],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],

})
export class PurchaseModule {}
