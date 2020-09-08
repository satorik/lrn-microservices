import { Publisher, ExpirationCompleteEvent, Subjects } from '@ftadev/common'

export class ExpirationCompletePublisher extends Publisher<
  ExpirationCompleteEvent
> {
  readonly subject = Subjects.ExpirationComplete
}
