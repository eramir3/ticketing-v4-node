import mongoose from 'mongoose';
import { ticketModel } from '../../../../test/setup';

describe('TicketSchema', () => {
  it('implements optimistic concurrency control', async () => {
    const ticket = await ticketModel.create({
      title: 'concert',
      price: 5,
      userId: 'user-123',
    });

    const firstInstance = await ticketModel.findById(ticket.id);
    const secondInstance = await ticketModel.findById(ticket.id);

    expect(firstInstance).not.toBeNull();
    expect(secondInstance).not.toBeNull();

    firstInstance!.set({ price: 10 });
    secondInstance!.set({ price: 15 });

    await firstInstance!.save();

    await expect(secondInstance!.save()).rejects.toBeInstanceOf(
      mongoose.Error.VersionError
    );
  });

  it('increments the version number on multiple saves', async () => {
    const ticket = await ticketModel.create({
      title: 'concert',
      price: 20,
      userId: 'user-123',
    });

    expect(ticket.version).toBe(0);

    ticket.set({ price: 25 });
    await ticket.save();
    expect(ticket.version).toBe(1);

    ticket.set({ price: 30 });
    await ticket.save();
    expect(ticket.version).toBe(2);
  });
});
