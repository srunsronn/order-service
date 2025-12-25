import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.ordersService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }
}
