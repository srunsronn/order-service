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
    get: jest.fn(),
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
      const mockResponse1: AxiosResponse = {
        data: {
          id: 1,
          name: 'Product 1',
          sku: 'PROD-001',
          price: '10.00',
          stock: 100,
          image: '',
          created_at: '2025-01-01T00:00:00.000000Z',
          updated_at: '2025-01-01T00:00:00.000000Z',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const mockResponse2: AxiosResponse = {
        data: {
          id: 2,
          name: 'Product 2',
          sku: 'PROD-002',
          price: '20.00',
          stock: 50,
          image: '',
          created_at: '2025-01-01T00:00:00.000000Z',
          updated_at: '2025-01-01T00:00:00.000000Z',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get
        .mockReturnValueOnce(of(mockResponse1))
        .mockReturnValueOnce(of(mockResponse2));

      const result = await service.checkAvailability({
        items: [
          { productId: '1', quantity: 5 },
          { productId: '2', quantity: 2 },
        ],
      });

      expect(result.available).toBe(true);
      expect(result.unavailableItems).toBeUndefined();
      expect(httpService.get).toHaveBeenCalledWith(
        'https://devops-api-gateway-production.up.railway.app/api/products/1',
      );
      expect(httpService.get).toHaveBeenCalledWith(
        'https://devops-api-gateway-production.up.railway.app/api/products/2',
      );
    });

    it('should return unavailable items when stock is insufficient', async () => {
      const mockResponse1: AxiosResponse = {
        data: {
          id: 1,
          name: 'Product 1',
          sku: 'PROD-001',
          price: '10.00',
          stock: 100,
          image: '',
          created_at: '2025-01-01T00:00:00.000000Z',
          updated_at: '2025-01-01T00:00:00.000000Z',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const mockResponse2: AxiosResponse = {
        data: {
          id: 2,
          name: 'Product 2',
          sku: 'PROD-002',
          price: '20.00',
          stock: 1,
          image: '',
          created_at: '2025-01-01T00:00:00.000000Z',
          updated_at: '2025-01-01T00:00:00.000000Z',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get
        .mockReturnValueOnce(of(mockResponse1))
        .mockReturnValueOnce(of(mockResponse2));

      const result = await service.checkAvailability({
        items: [
          { productId: '1', quantity: 5 },
          { productId: '2', quantity: 10 },
        ],
      });

      expect(result.available).toBe(false);
      expect(result.unavailableItems).toContain('2');
      expect(result.unavailableItems).not.toContain('1');
    });

    it('should mark items as unavailable when API call fails', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      const result = await service.checkAvailability({
        items: [{ productId: '1', quantity: 5 }],
      });

      expect(result.available).toBe(false);
      expect(result.unavailableItems).toContain('1');
    });
  });

  describe('deductStock', () => {
    it('should deduct stock successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: 1,
          name: 'Product 1',
          sku: 'PROD-001',
          price: '10.00',
          stock: 100,
          image: '',
          created_at: '2025-01-01T00:00:00.000000Z',
          updated_at: '2025-01-01T00:00:00.000000Z',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.deductStock('1', 5);

      expect(result.product_id).toBe('1');
      expect(result.new_quantity).toBe(95);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://devops-api-gateway-production.up.railway.app/api/products/1',
      );
    });

    it('should use positive quantity for removal', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: 1,
          name: 'Product 1',
          sku: 'PROD-001',
          price: '10.00',
          stock: 100,
          image: '',
          created_at: '2025-01-01T00:00:00.000000Z',
          updated_at: '2025-01-01T00:00:00.000000Z',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.deductStock('1', 3);

      expect(httpService.get).toHaveBeenCalledWith(
        'https://devops-api-gateway-production.up.railway.app/api/products/1',
      );
    });

    it('should throw HttpException when deduction fails', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Insufficient stock')),
      );

      await expect(service.deductStock('1', 1000)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
