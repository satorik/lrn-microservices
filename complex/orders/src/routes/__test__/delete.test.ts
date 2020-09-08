import request from 'supertest'
import { app } from '../../app'
import { natsWrapper } from '../../nats-wrapper'
import { Ticket } from '../../models/ticket'
import { OrderStatus } from '@ftadev/common'
import { Order } from '../../models/order'
import mongoose from 'mongoose'

it('mark the order as cancelled', async () => {
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    id: new mongoose.Types.ObjectId().toHexString(),
  })
  await ticket.save()

  const user = global.signin()

  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201)

  const { body: cancelledOrder } = await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(204)

  const updatedOrder = await Order.findById(order.id)

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled)
})

it('send an event after cancelling the order', async () => {
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    id: new mongoose.Types.ObjectId().toHexString(),
  })
  await ticket.save()

  const user = global.signin()

  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201)

  const { body: cancelledOrder } = await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(204)

  expect(natsWrapper.client.publish).toHaveBeenCalledTimes(2)
})
