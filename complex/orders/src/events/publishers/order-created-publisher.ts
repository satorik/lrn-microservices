import { Publisher, OrderCreatedEvent, Subjects } from '@ftadev/common'

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated
}
