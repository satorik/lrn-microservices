import { Publisher, Subjects, TicketCreatedEvent } from '@ftadev/common'

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated
}
