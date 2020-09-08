import { OrderCreatedListener } from '../order-created-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { Ticket } from '../../../models/ticket'
import mongoose from 'mongoose'
import { OrderCreatedEvent, OrderStatus } from '@ftadev/common'
import { Message } from 'node-nats-streaming'

const setup = async () => {
  const listener = new OrderCreatedListener(natsWrapper.client)

  const ticket = await Ticket.build({
    title: 'concert',
    price: 10,
    userId: 'sdfsdfsdfsdf',
  }).save()

  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Created,
    userId: 'dfsdfsdfsdferer',
    expiresAt: new Date().toISOString(),
    version: 0,
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
  }

  //@ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  }

  return { listener, data, ticket, msg }
}

it('sets the orderId of the ticket', async () => {
  const { listener, data, ticket, msg } = await setup()

  await listener.onMessage(data, msg)

  const updatedTicket = await Ticket.findById(ticket.id)

  expect(updatedTicket!.orderId).toEqual(data.id)
})

it('acks the message', async () => {
  const { listener, data, ticket, msg } = await setup()

  await listener.onMessage(data, msg)

  expect(msg.ack).toHaveBeenCalled()
})

it('publishes a ticket updated event', async () => {
  const { listener, data, ticket, msg } = await setup()

  await listener.onMessage(data, msg)

  expect(natsWrapper.client.publish).toHaveBeenCalled()

  const ticketUpdatedData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  )

  expect(data.id).toEqual(ticketUpdatedData.orderId)
})
