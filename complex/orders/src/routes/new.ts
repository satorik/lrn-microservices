import mongoose from 'mongoose'
import express, { Request, Response } from 'express'
import {
  requireAuth,
  validateRequest,
  NotFoundError,
  OrderStatus,
  BadRequestError,
} from '@ftadev/common'
import { body } from 'express-validator'
import { Order } from '../models/order'
import { Ticket } from '../models/ticket'

import { natsWrapper } from '../nats-wrapper'
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher'

const router = express.Router()

const EXPIRATION_WINDOW_SECONDS = 15 * 60

router.post(
  '/api/orders',
  requireAuth,
  [
    body('ticketId')
      .not()
      .isEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage('TicketId must be provided'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { ticketId } = req.body

    //find the ticket the user is trying to order in the database
    const ticket = await Ticket.findById(ticketId)
    if (!ticket) throw new NotFoundError()

    //make sure that this ticket is not already reserved
    const isReserved = await ticket.isReserved()
    if (isReserved) throw new BadRequestError('Ticket is already reserved')

    //calculate the expiration date for the order
    const expiration = new Date()
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS)

    // Build the order and save it to the database
    const order = Order.build({
      userId: req.currentUser!.id,
      status: OrderStatus.Created,
      expiredAt: expiration,
      ticket,
    })
    await order.save()

    //publish an event saying that an order was created
    new OrderCreatedPublisher(natsWrapper.client).publish({
      id: order.id,
      status: OrderStatus.Created,
      userId: order.userId,
      expiresAt: order.expiredAt.toISOString(),
      ticket: {
        id: order.ticket.id,
        price: order.ticket.price,
      },
      version: order.version,
    })

    res.status(201).send(order)
  }
)

export { router as createOrderRouter }
