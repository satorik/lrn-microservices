import { Publisher, PaymentCreatedEvent, Subjects } from '@ftadev/common'

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated
}
