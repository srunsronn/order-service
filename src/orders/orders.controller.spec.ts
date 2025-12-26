import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './enums/order-status.enum';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrdersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const createOrderDto: CreateOrderDto = {
        fullName: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        items: [
          {
            productId: 'PROD-001',
            quantity: 2,
            price: 99.99,
          },
        ],
      };

      const expectedResult = {
        id: 'test-uuid',
        userId: 'guest-123',
        ...createOrderDto,
        status: OrderStatus.PENDING,
        total: 199.98,
        createdAt: new Date(),
        items: createOrderDto.items.map(item => ({
          id: 'item-uuid',
          orderId: 'test-uuid',
          ...item,
        })),
      };

      mockOrdersService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createOrderDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createOrderDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const expectedResult = {
        data: [
          {
            id: 'order-1',
            userId: 'guest-123',
            fullName: 'John Doe',
            email: 'john@example.com',
            status: OrderStatus.PENDING,
            total: 199.98,
            createdAt: new Date(),
            items: [],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockOrdersService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(1, 10);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should use default pagination values', async () => {
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockOrdersService.findAll.mockResolvedValue(expectedResult);

      await controller.findAll(1, 10);

      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      const orderId = 'test-uuid';
      const expectedResult = {
        id: orderId,
        userId: 'guest-123',
        fullName: 'John Doe',
        email: 'john@example.com',
        status: OrderStatus.PENDING,
        total: 199.98,
        createdAt: new Date(),
        items: [],
      };

      mockOrdersService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(orderId);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(orderId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const orderId = 'test-uuid';
      const updateStatusDto: UpdateOrderStatusDto = {
        status: OrderStatus.CONFIRMED,
      };

      const expectedResult = {
        id: orderId,
        userId: 'guest-123',
        fullName: 'John Doe',
        email: 'john@example.com',
        status: OrderStatus.CONFIRMED,
        total: 199.98,
        createdAt: new Date(),
        items: [],
      };

      mockOrdersService.updateStatus.mockResolvedValue(expectedResult);

      const result = await controller.updateStatus(orderId, updateStatusDto);

      expect(result).toEqual(expectedResult);
      expect(service.updateStatus).toHaveBeenCalledWith(orderId, updateStatusDto);
      expect(service.updateStatus).toHaveBeenCalledTimes(1);
    });
  });
});
