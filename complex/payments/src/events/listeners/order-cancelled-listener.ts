import {
  Listener,
  Subjects,
  OrderCancelledEvent,
  OrderStatus,
} from '@ftadev/common'
import { queueGroupName } from './queue-group-name'
import { Message } from 'node-nats-streaming'
import { Order } from '../../models/order'

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled
  queueGroupName = queueGroupName

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    const order = await Order.findOne({
      _id: data.id,
      version: data.version - 1,
    })

    if (!order) throw new Error('order not found')
    await order.set({ status: OrderStatus.Cancelled }).save()

    msg.ack()
  }
}
