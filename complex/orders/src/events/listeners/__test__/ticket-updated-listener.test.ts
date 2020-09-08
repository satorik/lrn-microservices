import mongoose from 'mongoose'
import { natsWrapper } from '../../../nats-wrapper'
import { TicketUpdatedEvent } from '@ftadev/common'
import { Message } from 'node-nats-streaming'
import { Ticket } from '../../../models/ticket'
import { TicketUpdatedListener } from '../ticket-updated-listener'

const setup = async () => {
  const listener = new TicketUpdatedListener(natsWrapper.client)

  const ticket = await Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 10,
  }).save()

  const data: TicketUpdatedEvent['data'] = {
    version: ticket.version + 1,
    id: ticket.id,
    title: ticket.title,
    price: 999,
    userId: new mongoose.Types.ObjectId().toHexString(),
  }

  //@ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  }

  return { listener, data, msg, ticket }
}

it('updated the ticket', async () => {
  const { listener, data, msg } = await setup()

  await listener.onMessage(data, msg)

  const updatedTicket = await Ticket.findById(data.id)

  expect(updatedTicket).toBeDefined()
  expect(updatedTicket!.title).toEqual(data.title)
  expect(updatedTicket!.price).toEqual(data.price)
  expect(updatedTicket!.version).toEqual(data.version)
})

it('acks the message', async () => {
  const { listener, data, msg } = await setup()

  await listener.onMessage(data, msg)

  expect(msg.ack).toHaveBeenCalled()
})

it('does not call ack if the event has a skipped verstion', async () => {
  const { listener, data, msg } = await setup()

  data.version = 10

  try {
    await listener.onMessage(data, msg)
  } catch (err) {}

  expect(msg.ack).not.toHaveBeenCalled()
})
