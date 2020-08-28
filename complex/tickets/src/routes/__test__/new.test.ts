import request from 'supertest'
import { app } from '../../app'
import { Ticket } from '../../models/ticket'

it('1.has a route hadnler listening to /api/tickets for post request', async () => {
  const response = await request(app).post('/api/tickets').send({})
  expect(response.status).not.toEqual(404)
})

it('2.can only be accessed if user is signed in', async () => {
  await request(app).post('/api/tickets').send({}).expect(401)
})

it('3.returns a status other than 401 if the user is signed in', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({})

  expect(response.status).not.toEqual(401)
})

it('4.return an error if an invalid title is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: '',
      price: 10,
    })
    .expect(400)

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      price: 10,
    })
    .expect(400)
})

it('5.return an error if an invalid price is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'Asdasdas',
      price: -10,
    })
    .expect(400)

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'Aasdasdasd',
    })
    .expect(400)
})

it('6.creates a ticket with a valid inputs', async () => {
  let tickets = await Ticket.find({})

  expect(tickets.length).toEqual(0)
  const title = 'asdasdasd'

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title,
      price: 20,
    })
    .expect(201)

  tickets = await Ticket.find({})
  expect(tickets.length).toEqual(1)
  expect(tickets[0].price).toEqual(20)
  expect(tickets[0].title).toEqual(title)
})
