import { v4 as uuidv4 } from 'uuid';
import type { RepositoryBundle } from '../../domain/ports/repository.port.js';
import type { AiProviderPort } from '../../domain/ports/infrastructure.port.js';
import type { EventBusPort } from '../../domain/ports/event-bus.port.js';
import type { RagRetrievalEngine } from '../../infrastructure/ai/rag-retrieval.engine.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/domain-errors.js';

export class ConversationServiceFacade {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly ragEngine: RagRetrievalEngine,
    private readonly ai: AiProviderPort,
    private readonly eventBus: EventBusPort
  ) {}

  async list(workspaceId: string, userId: string) {
    await this.assertMembership(workspaceId, userId);
    const conversations = await this.repos.conversations.listByWorkspace(workspaceId, userId);
    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      model: c.model,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async getMessages(conversationId: string, userId: string) {
    const conv = await this.repos.conversations.findById(conversationId);
    if (!conv) throw new NotFoundError('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenError('Access denied');
    const messages = await this.repos.messages.listByConversation(conversationId);
    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      sources: JSON.parse(m.sources) as string[],
      createdAt: m.createdAt,
    }));
  }

  async create(workspaceId: string, userId: string, title: string) {
    await this.assertMembership(workspaceId, userId);
    const conv = await this.repos.conversations.create({
      workspaceId,
      userId,
      title,
      model: 'gpt-4o-mini',
    });
    return { id: conv.id, title: conv.title, model: conv.model, createdAt: conv.createdAt };
  }

  async sendMessage(conversationId: string, userId: string, content: string) {
    const conv = await this.repos.conversations.findById(conversationId);
    if (!conv) throw new NotFoundError('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenError('Access denied');

    await this.repos.messages.create({
      conversationId,
      role: 'user',
      content,
      tokenCount: Math.ceil(content.length / 4),
      sources: '[]',
    });

    const retrieval = await this.ragEngine.retrieve(conv.workspaceId, content);
    const systemPrompt = this.ragEngine.buildSystemPrompt();
    const completion = await this.ai.complete(systemPrompt, content, retrieval.contextText);

    const assistantMsg = await this.repos.messages.create({
      conversationId,
      role: 'assistant',
      content: completion.content,
      tokenCount: completion.tokenCount,
      sources: JSON.stringify(retrieval.sourceDocumentIds),
    });

    await this.repos.conversations.update(conversationId, { title: conv.title });

    const today = new Date().toISOString().split('T')[0];
    const snapshots = await this.repos.analytics.getByWorkspace(conv.workspaceId, 1);
    const todaySnapshot = snapshots.find((s) => s.date === today);
    await this.repos.analytics.upsert({
      workspaceId: conv.workspaceId,
      date: today,
      documentsProcessed: todaySnapshot?.documentsProcessed ?? 0,
      queriesExecuted: (todaySnapshot?.queriesExecuted ?? 0) + 1,
      tokensConsumed: (todaySnapshot?.tokensConsumed ?? 0) + completion.tokenCount,
      activeUsers: todaySnapshot?.activeUsers ?? 1,
    });

    await this.eventBus.publish({
      eventId: uuidv4(),
      eventType: 'conversation.message.sent',
      aggregateId: conversationId,
      occurredAt: new Date(),
      payload: { userId, tokenCount: completion.tokenCount },
    });

    return {
      id: assistantMsg.id,
      role: 'assistant' as const,
      content: assistantMsg.content,
      sources: retrieval.sourceDocumentIds,
      model: completion.model,
      createdAt: assistantMsg.createdAt,
    };
  }

  async delete(conversationId: string, userId: string) {
    const conv = await this.repos.conversations.findById(conversationId);
    if (!conv) throw new NotFoundError('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenError('Access denied');
    await this.repos.conversations.delete(conversationId);
  }

  private async assertMembership(workspaceId: string, userId: string) {
    const member = await this.repos.workspaceMembers.findByWorkspaceAndUser(workspaceId, userId);
    if (!member) throw new ForbiddenError('Not a workspace member');
  }
}
