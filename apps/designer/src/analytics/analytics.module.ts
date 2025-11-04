import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from '@app/database/schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Transaction.name, schema: TransactionSchema}
    ])
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController]
})
export class AnalyticsModule {}
