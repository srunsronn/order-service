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
   * Calls the bulk check-availability endpoint via API Gateway
   * POST /stock/check-availability/bulk
   */
  async checkAvailability(
    request: InventoryCheckRequest,
  ): Promise<InventoryCheckResponse> {
    try {
      this.logger.log(`Checking inventory for ${request.items.length} items`);

      // Use API Gateway bulk check-availability endpoint
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.inventoryUrl}/stock/check-availability/bulk`,
          {
            items: request.items.map(item => ({
              product_id: item.productId,
              required_quantity: item.quantity,
            })),
          },
        ),
      );

      const { all_available, items } = response.data;

      const unavailableItems = items
        .filter(item => !item.available)
        .map(item => item.product_id);

      return {
        available: all_available,
        unavailableItems: all_available ? undefined : unavailableItems,
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
   * Deduct stock for a single product via API Gateway
   * POST /stock/{productId}/remove
   * This should be called after order is confirmed
   */
  async deductStock(
    productId: string,
    quantity: number,
  ): Promise<StockDeductResponse> {
    try {
      this.logger.log(
        `Deducting ${quantity} units of product ${productId}`,
      );

      const response = await firstValueFrom(
        this.httpService.post<StockDeductResponse>(
          `${this.inventoryUrl}/stock/${productId}/remove`,
          { 
            quantity: quantity,  // Positive quantity (API Gateway handles as removal)
            reason: `Order placement - deducted ${quantity} units`
          },
        ),
      );

      return response.data;
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
