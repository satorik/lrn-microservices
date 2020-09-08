import { Listener, OrderCreatedEvent, Subjects } from '@ftadev/common'
import { queueGroupName } from './queue-group-name'
import { Message } from 'node-nats-streaming'
import { Order } from '../../models/order'

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated
  queueGroupName = queueGroupName
  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    try {
      const order = await Order.build({
        id: data.id,
        version: data.version,
        price: data.ticket.price,
        userId: data.userId,
        status: data.status,
      }).save()
    } catch (err) {
      console.log(err)
    }

    msg.ack()
  }
}
