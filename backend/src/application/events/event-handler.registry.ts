import type { EventHandler, DomainEvent } from '../../domain/ports/event-bus.port.js';
import type { RepositoryBundle } from '../../domain/ports/repository.port.js';

export class DocumentIndexedEventHandler implements EventHandler {
  constructor(private readonly repos: RepositoryBundle) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event.eventType !== 'document.indexed') return;
    const { workspaceId, title } = event.payload as { workspaceId: string; title: string };
    await this.repos.activityLogs.create({
      workspaceId,
      userId: event.aggregateId,
      action: 'document.indexed',
      resourceType: 'document',
      resourceId: event.aggregateId,
      metadata: JSON.stringify({ title }),
    });
  }
}

export class UserRegisteredEventHandler implements EventHandler {
  constructor(private readonly repos: RepositoryBundle) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event.eventType !== 'user.registered') return;
    const { workspaceId } = event.payload as { workspaceId: string };
    await this.repos.activityLogs.create({
      workspaceId,
      userId: event.aggregateId,
      action: 'user.registered',
      resourceType: 'user',
      resourceId: event.aggregateId,
      metadata: JSON.stringify({ email: event.payload.email }),
    });
  }
}

export class EventHandlerRegistry {
  static register(repos: RepositoryBundle, eventBus: import('../../domain/ports/event-bus.port.js').EventBusPort): void {
    eventBus.subscribe('document.indexed', new DocumentIndexedEventHandler(repos));
    eventBus.subscribe('user.registered', new UserRegisteredEventHandler(repos));
    eventBus.subscribe('workspace.created', {
      handle: async (event: DomainEvent) => {
        console.log(`[EVENT] Workspace created: ${event.aggregateId}`);
      },
    });
    eventBus.subscribe('conversation.message.sent', {
      handle: async (event: DomainEvent) => {
        console.log(`[EVENT] Message sent in ${event.aggregateId}, tokens: ${(event.payload as { tokenCount: number }).tokenCount}`);
      },
    });
  }
}
