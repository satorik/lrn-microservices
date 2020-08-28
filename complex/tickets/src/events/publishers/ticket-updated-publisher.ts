import { Publisher, Subjects, TicketUpdatedEvent } from '@ftadev/common'

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated
}
