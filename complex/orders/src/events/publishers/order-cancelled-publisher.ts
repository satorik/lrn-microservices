import { Publisher, Subjects, OrderCancelledEvent } from '@ftadev/common'

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled
}
