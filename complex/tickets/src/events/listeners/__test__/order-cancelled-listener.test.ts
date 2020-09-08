import { natsWrapper } from '../../../nats-wrapper'
import { Ticket } from '../../../models/ticket'
import mongoose from 'mongoose'
import { OrderCancelledEvent } from '@ftadev/common'
import { Message } from 'node-nats-streaming'
import { OrderCancelledListener } from '../order-cancelled-listener'

const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client)

  const orderId = mongoose.Types.ObjectId().toHexString()
  const ticket = await Ticket.build({
    title: 'concert',
    price: 10,
    userId: 'sdfsdfsdfsdf',
  }).save()

  await ticket.set({ orderId }).save()

  const data: OrderCancelledEvent['data'] = {
    id: orderId,
    version: 0,
    ticket: {
      id: ticket.id,
    },
  }

  //@ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  }

  return { listener, data, ticket, msg, orderId }
}

it('updated a ticket, publishes an event and acks a message', async () => {
  const { listener, data, ticket, msg, orderId } = await setup()

  await listener.onMessage(data, msg)

  const updatedTicket = await Ticket.findById(ticket.id)

  expect(updatedTicket!.orderId).not.toBeDefined()
  expect(msg.ack).toHaveBeenCalled()
  expect(natsWrapper.client.publish).toHaveBeenCalled()

  // const ticketUpdatedData = JSON.parse(
  //   (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  // )

  // expect(data.id).toEqual(ticketUpdatedData.orderId)
})
