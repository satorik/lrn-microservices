import mongoose from 'mongoose'
import { natsWrapper } from '../../../nats-wrapper'
import { ExpirationCompleteEvent, OrderStatus } from '@ftadev/common'
import { Message } from 'node-nats-streaming'
import { Ticket } from '../../../models/ticket'
import { ExpirationCompleteListener } from '../expiration-complete-listener'
import { Order } from '../../../models/order'

const setup = async () => {
  const listener = new ExpirationCompleteListener(natsWrapper.client)

  const ticket = await Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'sdfsdfsdf',
    price: 20,
  }).save()

  const order = await Order.build({
    userId: 'sdfsdfsdfsdf',
    status: OrderStatus.Created,
    expiredAt: new Date(),
    ticket,
  }).save()

  const data: ExpirationCompleteEvent['data'] = {
    orderId: order.id,
  }

  //@ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  }

  return { listener, data, msg, order, ticket }
}

it('updates the order status to cancel', async () => {
  const { listener, data, msg, order, ticket } = await setup()

  await listener.onMessage(data, msg)

  const updatedOrder = await Order.findById(order.id)

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled)
})

it('emits an OrderCancelled event', async () => {
  const { listener, data, msg, order, ticket } = await setup()

  await listener.onMessage(data, msg)

  expect(natsWrapper.client.publish).toHaveBeenCalled()

  const eventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  )
  expect(eventData.id).toEqual(order.id)
})

it('acks the message', async () => {
  const { listener, data, msg, order, ticket } = await setup()

  await listener.onMessage(data, msg)

  expect(msg.ack).toHaveBeenCalled()
})
