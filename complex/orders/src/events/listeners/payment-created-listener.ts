import {
  Listener,
  PaymentCreatedEvent,
  Subjects,
  OrderStatus,
} from '@ftadev/common'
import { queueGroupName } from './queue-geoup-name'
import { Message } from 'node-nats-streaming'
import { Order } from '../../models/order'

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated
  queueGroupName = queueGroupName

  async onMessage(data: PaymentCreatedEvent['data'], msg: Message) {
    const order = await Order.findById(data.orderId)
    if (!order) throw new Error('Order not found')

    await order.set({ status: OrderStatus.Complete }).save()

    msg.ack()
  }
}
