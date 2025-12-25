import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { OrdersModule } from './orders/orders.module';
import { HealthController } from './health/health.controller';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [Order, OrderItem],
        synchronize: true, // Set to false after first deployment
        logging: configService.get('nodeEnv') === 'development',
      }),
      inject: [ConfigService],
    }),
    OrdersModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
