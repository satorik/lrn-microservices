import mongoose from 'mongoose'
import request from 'supertest'
import { app } from '../../app'
import { Ticket } from '../../models/ticket'

const createTicket = async (title: string, price: number) => {
  const ticket = Ticket.build({
    title,
    price,
    id: new mongoose.Types.ObjectId().toHexString(),
  })

  await ticket.save()

  return ticket
}

it('can fetch a list of orders for a user', async () => {
  const ticket1 = await createTicket('sdfsdfs', 20)
  const ticket2 = await createTicket('dfdfdfdf', 10)
  const ticket3 = await createTicket('fgfgfgfg', 15)

  const user1 = global.signin()
  const user2 = global.signin()

  const { body: order1 } = await request(app)
    .post('/api/orders')
    .set('Cookie', user1)
    .send({ ticketId: ticket1.id })
    .expect(201)

  const { body: order2 } = await request(app)
    .post('/api/orders')
    .set('Cookie', user2)
    .send({ ticketId: ticket2.id })
    .expect(201)

  const { body: order3 } = await request(app)
    .post('/api/orders')
    .set('Cookie', user2)
    .send({ ticketId: ticket3.id })
    .expect(201)

  const { body: response } = await request(app)
    .get('/api/orders')
    .set('Cookie', user2)
    .send()
    .expect(200)

  expect(response.length).toEqual(2)
  expect(response[0].id).toEqual(order2.id)
  expect(response[1].id).toEqual(order3.id)
  expect(response[0].ticket.id).toEqual(ticket2.id)
  expect(response[1].ticket.id).toEqual(ticket3.id)
})
