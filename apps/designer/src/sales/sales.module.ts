import { Order, OrderSchema } from '@app/database/schemas/order.shema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';

@Module({
    imports: [MongooseModule.forFeature([{name: Order.name, schema: OrderSchema},
                                        
    ]),
    ],
    providers: [SalesService],
    exports: [SalesService],
    controllers: [SalesController]
})
export class SalesModule {}
