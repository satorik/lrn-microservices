import request from 'supertest'
import { app } from '../../app'
import mongoose from 'mongoose'
import { natsWrapper } from '../../nats-wrapper'
import { Ticket } from '../../models/ticket'

it('1.returns a 404 if the provided id does not exists', async () => {
  const id = new mongoose.Types.ObjectId().toHexString()
  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'sdfsdfsf',
      price: 20,
    })
    .expect(404)
})

it('2.returns a 401 if a user is not authenticated', async () => {
  const id = new mongoose.Types.ObjectId().toHexString()
  await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: 'sdfsdfsf',
      price: 20,
    })
    .expect(401)
})

it('3.returns a 401 if the user does not own a ticket', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'sdfsdfsdf',
      price: 10,
    })

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'fdfgdfgdg',
      price: 100,
    })
    .expect(401)
})

it('4.returns a 400 if the user provides an invalid title or price', async () => {
  const userCookie = global.signin()

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', userCookie)
    .send({
      title: 'sdfsdfsdf',
      price: 10,
    })

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', userCookie)
    .send({
      title: '',
      price: 20,
    })
    .expect(400)

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', userCookie)
    .send({
      title: 'sdfsdfsdff',
      price: -20,
    })
    .expect(400)
})

it('5.updates the ticket provides a valid input', async () => {
  const userCookie = global.signin()

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', userCookie)
    .send({
      title: 'sdfsdfsdf',
      price: 10,
    })

  const title = 'New Title'
  const price = 20

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', userCookie)
    .send({
      title,
      price,
    })
    .expect(200)

  const ticketResponse = await request(app).get(
    `/api/tickets/${response.body.id}`
  )

  expect(ticketResponse.body.title).toEqual(title)
  expect(ticketResponse.body.price).toEqual(price)
})

it('publishes an event', async () => {
  const userCookie = global.signin()

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', userCookie)
    .send({
      title: 'sdfsdfsdf',
      price: 10,
    })

  const title = 'New Title'
  const price = 20

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', userCookie)
    .send({
      title,
      price,
    })
    .expect(200)

  expect(natsWrapper.client.publish).toHaveBeenCalled()
})

it('rejects updates if the ticket is reserved', async () => {
  const userCookie = global.signin()

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', userCookie)
    .send({
      title: 'sdfsdfsdf',
      price: 10,
    })

  const ticket = await Ticket.findById(response.body.id)

  await ticket!.set({ orderId: mongoose.Types.ObjectId().toHexString() }).save()

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', userCookie)
    .send({
      title: 'concert',
      price: 234,
    })
    .expect(400)
})
