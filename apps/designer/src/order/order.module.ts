import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from '../cart/cart.module';
import { Order, OrderSchema } from '@app/database/schemas/order.shema';
import { Design, DesignSchema } from '@app/database/schemas/design.schema';
import { Purchase, PurchaseSchema } from '@app/database/schemas/purchase.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Design.name, schema: DesignSchema },
      { name: Purchase.name, schema: PurchaseSchema },
    ]),
    CartModule,
    NotificationModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],

})
export class OrderModule {}
