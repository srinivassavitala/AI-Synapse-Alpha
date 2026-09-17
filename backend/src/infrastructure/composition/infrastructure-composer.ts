import type { EventBusPort } from '../../domain/ports/event-bus.port.js';
import type { RepositoryBundle } from '../../domain/ports/repository.port.js';
import type { AuthTokenPort, AiProviderPort, CachePort } from '../../domain/ports/infrastructure.port.js';
import { SqliteUserRepository } from '../persistence/sqlite/repositories/user.repository.js';
import { SqliteWorkspaceRepository, SqliteWorkspaceMemberRepository } from '../persistence/sqlite/repositories/workspace.repository.js';
import { SqliteDocumentRepository, SqliteDocumentChunkRepository } from '../persistence/sqlite/repositories/document.repository.js';
import { SqliteConversationRepository, SqliteMessageRepository } from '../persistence/sqlite/repositories/conversation.repository.js';
import {
  SqliteApiKeyRepository,
  SqliteActivityLogRepository,
  SqliteAnalyticsRepository,
  SqliteIntegrationRepository,
} from '../persistence/sqlite/repositories/auxiliary.repository.js';
import { JwtAuthTokenAdapter } from '../auth/jwt-auth-token.adapter.js';
import { HybridAiProviderAdapter } from '../ai/hybrid-ai-provider.adapter.js';
import { InMemoryCacheAdapter } from '../cache/in-memory-cache.adapter.js';
import { DocumentProcessingPipeline } from '../pipelines/document-processing.pipeline.js';
import { RagRetrievalEngine } from '../ai/rag-retrieval.engine.js';
import { getDatabase } from '../persistence/sqlite/database-connection.js';

export interface InfrastructureBundle {
  repositories: RepositoryBundle;
  auth: AuthTokenPort;
  ai: AiProviderPort;
  cache: CachePort;
  documentPipeline: DocumentProcessingPipeline;
  ragEngine: RagRetrievalEngine;
}

export class InfrastructureComposer {
  static compose(_eventBus: EventBusPort): InfrastructureBundle {
    const repositories: RepositoryBundle = {
      users: new SqliteUserRepository(),
      workspaces: new SqliteWorkspaceRepository(),
      workspaceMembers: new SqliteWorkspaceMemberRepository(),
      documents: new SqliteDocumentRepository(),
      documentChunks: new SqliteDocumentChunkRepository(),
      conversations: new SqliteConversationRepository(),
      messages: new SqliteMessageRepository(),
      apiKeys: new SqliteApiKeyRepository(),
      activityLogs: new SqliteActivityLogRepository(),
      analytics: new SqliteAnalyticsRepository(),
      integrations: new SqliteIntegrationRepository(),
    };

    const auth = new JwtAuthTokenAdapter();
    const ai = new HybridAiProviderAdapter();
    const cache = new InMemoryCacheAdapter();
    const documentPipeline = new DocumentProcessingPipeline(repositories, ai);
    const ragEngine = new RagRetrievalEngine(repositories, ai);

    // Warm SQLite on compose so persistence + telemetry bootstrap run at server start.
    getDatabase();

    return { repositories, auth, ai, cache, documentPipeline, ragEngine };
  }
}
