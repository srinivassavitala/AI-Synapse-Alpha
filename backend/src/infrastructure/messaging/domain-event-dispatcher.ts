import type { DomainEvent, EventHandler, EventBusPort } from '../../domain/ports/event-bus.port.js';

export class DomainEventDispatcher implements EventBusPort {
  private readonly handlers = new Map<string, EventHandler[]>();

  subscribe(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? [];
    await Promise.allSettled(handlers.map((h) => h.handle(event)));
  }
}
