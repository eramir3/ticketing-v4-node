import { NotFoundError } from '@org/errors';
import { TicketCreatedEvent, TicketUpdatedEvent } from '@org/transport';
import { TicketsService } from './tickets.service';

type TicketProjectionCreateInput = Pick<
  TicketCreatedEvent['data'],
  'id' | 'title' | 'price' | 'version'
>;

type TicketProjectionUpdateInput = Pick<
  TicketUpdatedEvent['data'],
  'id' | 'title' | 'price' | 'version'
>;

const buildCreateTicketInput = (
  overrides: Partial<TicketProjectionCreateInput> = {}
): TicketProjectionCreateInput => ({
  id: '507f1f77bcf86cd799439011',
  title: 'concert',
  price: 10,
  version: 0,
  ...overrides,
});

const buildUpdateTicketInput = (
  overrides: Partial<TicketProjectionUpdateInput> = {}
): TicketProjectionUpdateInput => ({
  id: '507f1f77bcf86cd799439011',
  title: 'updated concert',
  price: 15,
  version: 2,
  ...overrides,
});

const buildTicketModel = () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
});

describe('Orders TicketsService', () => {
  it('stores the version coming from the created event', async () => {
    const ticketModel = buildTicketModel();
    const orderModel = {
      findOne: jest.fn(),
    };
    const createdTicket = {
      id: '507f1f77bcf86cd799439011',
      title: 'concert',
      price: 10,
      version: 0,
    };
    const service = new TicketsService(ticketModel as never, orderModel as never);
    const createTicketInput = buildCreateTicketInput();

    ticketModel.create.mockResolvedValueOnce(createdTicket);

    const result = await service.create(createTicketInput);

    expect(ticketModel.create).toHaveBeenCalledWith({
      _id: createTicketInput.id,
      title: createTicketInput.title,
      price: createTicketInput.price,
      version: createTicketInput.version,
    });
    expect(result).toBe(createdTicket);
  });

  it('updates the version only from the updated event payload', async () => {
    const ticketModel = buildTicketModel();
    const orderModel = {
      findOne: jest.fn(),
    };
    const ticketDocument = {
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const service = new TicketsService(ticketModel as never, orderModel as never);
    const updateTicketInput = buildUpdateTicketInput();

    ticketModel.findOne.mockResolvedValueOnce(ticketDocument);

    await service.update(updateTicketInput);

    expect(ticketModel.findOne).toHaveBeenCalledWith({
      _id: updateTicketInput.id,
      version: updateTicketInput.version - 1,
    });
    expect(ticketDocument.set).toHaveBeenCalledWith({
      title: updateTicketInput.title,
      price: updateTicketInput.price,
      version: updateTicketInput.version,
    });
    expect(ticketDocument.save).toHaveBeenCalledTimes(1);
  });

  it('throws if the previous projected version is missing', async () => {
    const ticketModel = buildTicketModel();
    const orderModel = {
      findOne: jest.fn(),
    };
    const service = new TicketsService(ticketModel as never, orderModel as never);

    ticketModel.findOne.mockResolvedValueOnce(null);

    await expect(service.update(buildUpdateTicketInput())).rejects.toThrow(
      NotFoundError
    );
  });
});
