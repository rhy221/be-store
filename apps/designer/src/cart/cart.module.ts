import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from '@app/database/schemas/cart.schema';
import { Design, DesignSchema } from '@app/database/schemas/design.schema';
import { Purchase, PurchaseSchema } from '@app/database/schemas/purchase.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Design.name, schema: DesignSchema },
      { name: Purchase.name, schema: PurchaseSchema },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],

})
export class CartModule {}
