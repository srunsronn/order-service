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
   * Calls the inventory service for each item individually
   * GET /inventory/{productId}/check/{quantity}
   */
  async checkAvailability(
    request: InventoryCheckRequest,
  ): Promise<InventoryCheckResponse> {
    try {
      this.logger.log(`Checking inventory for ${request.items.length} items`);

      const unavailableItems: string[] = [];

      // Check each item individually
      for (const item of request.items) {
        const isAvailable = await this.checkSingleItem(
          item.productId,
          item.quantity,
        );

        if (!isAvailable) {
          unavailableItems.push(item.productId);
        }
      }

      const allAvailable = unavailableItems.length === 0;

      if (!allAvailable) {
        this.logger.warn(
          `Items not available: ${unavailableItems.join(', ')}`,
        );
      }

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
   * Check stock availability for a single product
   * GET /inventory/{productId}/check/{quantity}
   */
  private async checkSingleItem(
    productId: string,
    quantity: number,
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<SingleStockCheckResponse>(
          `${this.inventoryUrl}/inventory/${productId}/check/${quantity}`,
        ),
      );

      return response.data.available;  // Changed from is_available to available
    } catch (error) {
      this.logger.error(
        `Failed to check stock for product ${productId}: ${error.message}`,
      );
      // If product doesn't exist or service fails, consider it unavailable
      return false;
    }
  }

  /**
   * Deduct stock for a single product
   * PUT /inventory/{productId}/deduct
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
        this.httpService.put<StockDeductResponse>(
          `${this.inventoryUrl}/inventory/${productId}/deduct`,
          { quantity } as StockDeductRequest,
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
