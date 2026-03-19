import { NotFoundError } from '@org/errors';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

const buildCreateTicketDto = (
  overrides: Partial<CreateTicketDto> = {}
): CreateTicketDto => ({
  id: '507f1f77bcf86cd799439011',
  title: 'concert',
  price: 10,
  version: 0,
  ...overrides,
});

const buildUpdateTicketDto = (
  overrides: Partial<UpdateTicketDto> = {}
): UpdateTicketDto => ({
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
    const createTicketDto = buildCreateTicketDto();

    ticketModel.create.mockResolvedValueOnce(createdTicket);

    const result = await service.create(createTicketDto);

    expect(ticketModel.create).toHaveBeenCalledWith({
      _id: createTicketDto.id,
      title: createTicketDto.title,
      price: createTicketDto.price,
      version: createTicketDto.version,
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
    const updateTicketDto = buildUpdateTicketDto();

    ticketModel.findOne.mockResolvedValueOnce(ticketDocument);

    await service.update(updateTicketDto);

    expect(ticketModel.findOne).toHaveBeenCalledWith({
      _id: updateTicketDto.id,
      version: updateTicketDto.version - 1,
    });
    expect(ticketDocument.set).toHaveBeenCalledWith({
      title: updateTicketDto.title,
      price: updateTicketDto.price,
      version: updateTicketDto.version,
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

    await expect(service.update(buildUpdateTicketDto())).rejects.toThrow(
      NotFoundError
    );
  });
});
