import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    mockConfigService.get.mockReturnValue(
      'https://devops-api-gateway-production.up.railway.app/api',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAvailability', () => {
    it('should check availability for multiple items successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          all_available: true,
          items: [
            {
              product_id: 'PROD-001',
              available: true,
              current_quantity: 100,
              required_quantity: 5,
            },
            {
              product_id: 'PROD-002',
              available: true,
              current_quantity: 50,
              required_quantity: 2,
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.checkAvailability({
        items: [
          { productId: 'PROD-001', quantity: 5 },
          { productId: 'PROD-002', quantity: 2 },
        ],
      });

      expect(result.available).toBe(true);
      expect(result.unavailableItems).toBeUndefined();
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('check-availability/bulk'),
        {
          items: [
            { product_id: 'PROD-001', required_quantity: 5 },
            { product_id: 'PROD-002', required_quantity: 2 },
          ],
        },
      );
    });

    it('should return unavailable items when stock is insufficient', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          all_available: false,
          items: [
            {
              product_id: 'PROD-001',
              available: true,
              current_quantity: 100,
              required_quantity: 5,
            },
            {
              product_id: 'PROD-002',
              available: false,
              current_quantity: 1,
              required_quantity: 10,
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.checkAvailability({
        items: [
          { productId: 'PROD-001', quantity: 5 },
          { productId: 'PROD-002', quantity: 10 },
        ],
      });

      expect(result.available).toBe(false);
      expect(result.unavailableItems).toContain('PROD-002');
      expect(result.unavailableItems).not.toContain('PROD-001');
    });

    it('should throw HttpException when API call fails', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(
        service.checkAvailability({
          items: [{ productId: 'PROD-001', quantity: 5 }],
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('deductStock', () => {
    it('should deduct stock successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          product_id: 'PROD-001',
          new_quantity: 95,
          message: 'Stock deducted successfully',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.deductStock('PROD-001', 5);

      expect(result.product_id).toBe('PROD-001');
      expect(result.new_quantity).toBe(95);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('PROD-001/remove'),
        {
          quantity: 5,
          reason: 'Order placement - deducted 5 units',
        },
      );
    });

    it('should use positive quantity for removal', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          product_id: 'PROD-001',
          new_quantity: 97,
          message: 'Stock deducted',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.deductStock('PROD-001', 3);

      expect(httpService.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          quantity: 3,
        }),
      );
    });

    it('should throw HttpException when deduction fails', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Insufficient stock')),
      );

      await expect(service.deductStock('PROD-001', 1000)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
