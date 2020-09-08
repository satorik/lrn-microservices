import mongoose from 'mongoose'
import { OrderCreatedListener } from '../order-created-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { OrderCreatedEvent, OrderStatus } from '@ftadev/common'
import { Order } from '../../../models/order'

const setup = async () => {
  const listener = new OrderCreatedListener(natsWrapper.client)

  const data: OrderCreatedEvent['data'] = {
    id: mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Created,
    userId: 'dfsdfsdfsdferer',
    expiresAt: new Date().toISOString(),
    version: 0,
    ticket: {
      id: mongoose.Types.ObjectId().toHexString(),
      price: 10,
    },
  }

  //@ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  }

  return { listener, data, msg }
}

it('replicates the order info', async () => {
  const { listener, data, msg } = await setup()
  await listener.onMessage(data, msg)
  const order = await Order.findById(data.id)
  expect(order!.price).toEqual(data.ticket.price)
})

it('acks the message', async () => {
  const { listener, data, msg } = await setup()
  await listener.onMessage(data, msg)
  expect(msg.ack).toHaveBeenCalled()
})
