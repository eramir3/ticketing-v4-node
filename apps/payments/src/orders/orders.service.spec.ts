import { OrderStatus } from '@org/common';
import { NotFoundError } from '@org/errors';
import { OrdersService } from './orders.service';

describe('Payments OrdersService', () => {
  it('stores the projected order from the created event', async () => {
    const orderModel = {
      create: jest.fn().mockResolvedValue({ id: 'order-123' }),
      findById: jest.fn(),
      findOne: jest.fn(),
    };
    const service = new OrdersService(orderModel as never);

    await service.create({
      id: 'order-123',
      version: 0,
      status: OrderStatus.Created,
      userId: 'user-123',
      expiresAt: new Date().toISOString(),
      ticket: {
        id: 'ticket-123',
        price: 20,
      },
    });

    expect(orderModel.create).toHaveBeenCalledWith({
      _id: 'order-123',
      price: 20,
      status: OrderStatus.Created,
      userId: 'user-123',
      version: 0,
    });
  });

  it('updates status and version from the cancelled event', async () => {
    const orderDocument = {
      status: OrderStatus.Created,
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const orderModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn().mockResolvedValue(orderDocument),
    };
    const service = new OrdersService(orderModel as never);

    await service.cancel({
      id: 'order-123',
      version: 1,
      ticket: {
        id: 'ticket-123',
      },
    });

    expect(orderModel.findOne).toHaveBeenCalledWith({
      _id: 'order-123',
      version: 0,
    });
    expect(orderDocument.set).toHaveBeenCalledWith({
      status: OrderStatus.Cancelled,
      version: 1,
    });
    expect(orderDocument.save).toHaveBeenCalledTimes(1);
  });

  it('throws if the previous projected version is missing', async () => {
    const orderModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const service = new OrdersService(orderModel as never);

    await expect(
      service.cancel({
        id: 'order-123',
        version: 1,
        ticket: {
          id: 'ticket-123',
        },
      })
    ).rejects.toThrow(NotFoundError);
  });
});
