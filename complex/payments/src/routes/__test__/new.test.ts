import request from 'supertest'
import { app } from '../../app'
import mongoose from 'mongoose'
import { Order } from '../../models/order'
import { stripe } from '../../stripe'
import { Payment } from '../../models/payment'
import { OrderStatus } from '@ftadev/common'

//jest.mock('../../stripe')

it('returns a 404 when purchasing an order that does not exists', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'tok_visa',
      orderId: mongoose.Types.ObjectId().toHexString(),
    })
    .expect(404)
})

it('returns a 401 when purchasing an order that does not belong to a user', async () => {
  const order = await Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Created,
    version: 0,
    price: 20,
  }).save()

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'tok_visa',
      orderId: order.id,
    })
    .expect(401)
})

it('returns a 400 when purchasing a cancelled order', async () => {
  const userId = mongoose.Types.ObjectId().toHexString()

  const order = await Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: userId,
    status: OrderStatus.Cancelled,
    version: 0,
    price: 20,
  }).save()

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id,
    })
    .expect(400)
})

it('returns a 204 with valid inputs', async () => {
  const userId = mongoose.Types.ObjectId().toHexString()
  const price = Math.floor(Math.random() * 100000)

  const order = await Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: userId,
    status: OrderStatus.Created,
    version: 0,
    price,
  }).save()

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id,
    })
    .expect(201)

  const srtipeCharges = await stripe.charges.list({ limit: 2 })
  const stripeCharge = srtipeCharges.data.find(
    (charge) => charge.amount === price * 100
  )

  expect(stripeCharge).toBeDefined()
  expect(stripeCharge!.currency).toEqual('usd')
})

it('saves a payment to the database', async () => {
  const userId = mongoose.Types.ObjectId().toHexString()
  const price = Math.floor(Math.random() * 100000)

  const order = await Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: userId,
    status: OrderStatus.Created,
    version: 0,
    price,
  }).save()

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id,
    })
    .expect(201)

  const srtipeCharges = await stripe.charges.list({ limit: 2 })
  const stripeCharge = srtipeCharges.data.find(
    (charge) => charge.amount === price * 100
  )

  expect(stripeCharge).toBeDefined()
  expect(stripeCharge!.currency).toEqual('usd')

  const payment = await Payment.findOne({
    stripeId: stripeCharge!.id,
    orderId: order.id,
  })

  expect(payment).not.toBeNull()
})
