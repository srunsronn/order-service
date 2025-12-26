import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  InventoryCheckRequest,
  InventoryCheckResponse,
  SingleStockCheckResponse,
  StockDeductRequest,
  StockDeductResponse,
} from './interfaces/inventory.interface';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private readonly inventoryUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.inventoryUrl = this.configService.get<string>('services.inventoryUrl') || '';
  }

  /**
   * Check availability for multiple items
   * Calls API Gateway /products endpoint to get product and check stock
   * GET /products/{id} for each product
   */
  async checkAvailability(
    request: InventoryCheckRequest,
  ): Promise<InventoryCheckResponse> {
    try {
      this.logger.log(`Checking product availability for ${request.items.length} items via API Gateway`);

      // Check each product through API Gateway /products endpoint
      const productChecks = await Promise.all(
        request.items.map(async (item) => {
          try {
            const response = await firstValueFrom(
              this.httpService.get(`${this.inventoryUrl}/products/${item.productId}`),
            );
            
            const product = response.data;
            const hasStock = product.stock >= item.quantity;
            
            this.logger.log(`Product ${item.productId}: stock=${product.stock}, required=${item.quantity}, available=${hasStock}`);
            
            return {
              product_id: item.productId,
              available: hasStock,
              current_quantity: product.stock,
              required_quantity: item.quantity,
            };
          } catch (error) {
            this.logger.error(`Product ${item.productId} not found or unavailable: ${error.message}`);
            return {
              product_id: item.productId,
              available: false,
              current_quantity: 0,
              required_quantity: item.quantity,
            };
          }
        }),
      );

      const allAvailable = productChecks.every(check => check.available);
      const unavailableItems = productChecks
        .filter(check => !check.available)
        .map(check => check.product_id);

      return {
        available: allAvailable,
        unavailableItems: allAvailable ? undefined : unavailableItems,
      };
    } catch (error) {
      this.logger.error(
        `Failed to check inventory: ${error.message}`,
        error.stack,
      );

      throw new HttpException(
        'Failed to verify inventory availability',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Verify product exists and has stock via API Gateway
   * GET /products/{productId}
   * Note: Actual stock deduction handled by inventory service in future
   */
  async deductStock(
    productId: string,
    quantity: number,
  ): Promise<StockDeductResponse> {
    try {
      this.logger.log(
        `Verifying product ${productId} for ${quantity} units via API Gateway`,
      );

      // Get product from API Gateway to verify it exists and has stock
      const response = await firstValueFrom(
        this.httpService.get(`${this.inventoryUrl}/products/${productId}`),
      );

      const product = response.data;
      
      if (product.stock < quantity) {
        throw new Error(`Insufficient stock: ${product.stock} available, ${quantity} required`);
      }

      this.logger.log(`Product ${productId} verified: stock=${product.stock}`);
      
      return {
        product_id: productId,
        new_quantity: product.stock - quantity,
        message: `Product ${productId} verified successfully`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to deduct stock for product ${productId}: ${error.message}`,
        error.stack,
      );

      throw new HttpException(
        `Failed to deduct stock for product ${productId}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
