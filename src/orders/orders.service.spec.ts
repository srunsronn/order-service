import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { InventoryService } from '../inventory/inventory.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './enums/order-status.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: Repository<Order>;
  let orderItemRepository: Repository<OrderItem>;
  let inventoryService: InventoryService;

  const mockOrderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockOrderItemRepository = {
    create: jest.fn(),
  };

  const mockInventoryService = {
    checkAvailability: jest.fn(),
    deductStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    orderItemRepository = module.get<Repository<OrderItem>>(
      getRepositoryToken(OrderItem),
    );
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOrderDto: CreateOrderDto = {
      fullName: 'Test User',
      email: 'test@example.com',
      address: '123 Test St',
      city: 'Test City',
      zipCode: '12345',
      items: [
        {
          productId: 'PROD-001',
          quantity: 2,
          price: 99.99,
        },
      ],
    };

    it('should create an order successfully', async () => {
      const mockOrder = {
        id: 'test-order-id',
        userId: expect.stringContaining('guest-'),
        ...createOrderDto,
        status: OrderStatus.PENDING,
        total: 199.98,
        createdAt: new Date(),
        items: [
          {
            id: 'test-item-id',
            productId: 'PROD-001',
            quantity: 2,
            price: 99.99,
          },
        ],
      };

      mockInventoryService.checkAvailability.mockResolvedValue({
        available: true,
      });

      mockOrderItemRepository.create.mockReturnValue({
        productId: 'PROD-001',
        quantity: 2,
        price: 99.99,
      });

      mockOrderRepository.create.mockReturnValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue(mockOrder);

      const result = await service.create(createOrderDto);

      expect(inventoryService.checkAvailability).toHaveBeenCalled();
      expect(orderRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.total).toBe(199.98);
    });

    it('should throw error when inventory is unavailable', async () => {
      mockInventoryService.checkAvailability.mockResolvedValue({
        available: false,
        unavailableItems: ['PROD-001'],
      });

      await expect(service.create(createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(inventoryService.checkAvailability).toHaveBeenCalled();
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should auto-generate userId for guest checkout', async () => {
      mockInventoryService.checkAvailability.mockResolvedValue({
        available: true,
      });

      mockOrderItemRepository.create.mockReturnValue({
        productId: 'PROD-001',
        quantity: 2,
        price: 99.99,
      });

      const mockOrder = {
        id: 'test-order-id',
        userId: 'guest-123456',
        status: OrderStatus.PENDING,
        total: 199.98,
      };

      mockOrderRepository.create.mockReturnValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue(mockOrder);

      const result = await service.create(createOrderDto);

      expect(result.userId).toMatch(/^guest-/);
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          userId: 'guest-123',
          status: OrderStatus.PENDING,
          total: 199.98,
          items: [],
        },
        {
          id: 'order-2',
          userId: 'guest-456',
          status: OrderStatus.CONFIRMED,
          total: 299.97,
          items: [],
        },
      ];

      mockOrderRepository.findAndCount.mockResolvedValue([mockOrders, 2]);

      const result = await service.findAll(1, 10);

      expect(result.data).toEqual(mockOrders);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(orderRepository.findAndCount).toHaveBeenCalled();
    });

    it('should calculate pagination correctly', async () => {
      const mockOrders = Array(25)
        .fill(null)
        .map((_, i) => ({
          id: `order-${i}`,
          userId: `user-${i}`,
          status: OrderStatus.PENDING,
          total: 99.99,
          items: [],
        }));

      mockOrderRepository.findAndCount.mockResolvedValue([
        mockOrders.slice(0, 10),
        25,
      ]);

      const result = await service.findAll(1, 10);

      expect(result.totalPages).toBe(3);
      expect(result.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      const mockOrder = {
        id: 'test-order-id',
        userId: 'guest-123',
        status: OrderStatus.PENDING,
        total: 199.98,
        items: [],
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne('test-order-id');

      expect(result).toEqual(mockOrder);
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-order-id' },
        relations: ['items'],
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    const mockOrder = {
      id: 'test-order-id',
      userId: 'guest-123',
      status: OrderStatus.PENDING,
      total: 199.98,
      items: [
        {
          id: 'item-1',
          productId: 'PROD-001',
          quantity: 2,
          price: 99.99,
        },
      ],
    };

    it('should update order status from PENDING to CONFIRMED', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });
      mockInventoryService.deductStock.mockResolvedValue({
        product_id: 'PROD-001',
        new_quantity: 98,
        message: 'Stock deducted',
      });

      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      };
      mockOrderRepository.save.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus('test-order-id', {
        status: OrderStatus.CONFIRMED,
      });

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(inventoryService.deductStock).toHaveBeenCalled();
      expect(orderRepository.save).toHaveBeenCalled();
    });

    it('should update order status from CONFIRMED to COMPLETED', async () => {
      const confirmedOrder = {
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      };

      mockOrderRepository.findOne.mockResolvedValue(confirmedOrder);

      const completedOrder = {
        ...confirmedOrder,
        status: OrderStatus.COMPLETED,
      };
      mockOrderRepository.save.mockResolvedValue(completedOrder);

      const result = await service.updateStatus('test-order-id', {
        status: OrderStatus.COMPLETED,
      });

      expect(result.status).toBe(OrderStatus.COMPLETED);
      expect(inventoryService.deductStock).not.toHaveBeenCalled();
    });

    it('should throw error for invalid status transition', async () => {
      const completedOrder = {
        ...mockOrder,
        status: OrderStatus.COMPLETED,
      };

      mockOrderRepository.findOne.mockResolvedValue(completedOrder);

      await expect(
        service.updateStatus('test-order-id', {
          status: OrderStatus.PENDING,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent-id', {
          status: OrderStatus.CONFIRMED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
