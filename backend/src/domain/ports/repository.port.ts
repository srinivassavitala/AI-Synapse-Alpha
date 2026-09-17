import type {
  UserEntity,
  WorkspaceEntity,
  WorkspaceMemberEntity,
  DocumentEntity,
  DocumentChunkEntity,
  ConversationEntity,
  MessageEntity,
  ApiKeyEntity,
  ActivityLogEntity,
  AnalyticsSnapshotEntity,
  IntegrationEntity,
} from '../entities/index.js';

export interface UserRepositoryPort {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
  listByWorkspace(workspaceId: string): Promise<UserEntity[]>;
}

export interface WorkspaceRepositoryPort {
  findById(id: string): Promise<WorkspaceEntity | null>;
  findBySlug(slug: string): Promise<WorkspaceEntity | null>;
  findByUserId(userId: string): Promise<WorkspaceEntity[]>;
  create(workspace: Omit<WorkspaceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkspaceEntity>;
  update(id: string, data: Partial<WorkspaceEntity>): Promise<WorkspaceEntity>;
}

export interface WorkspaceMemberRepositoryPort {
  findByWorkspaceAndUser(workspaceId: string, userId: string): Promise<WorkspaceMemberEntity | null>;
  listByWorkspace(workspaceId: string): Promise<WorkspaceMemberEntity[]>;
  create(member: Omit<WorkspaceMemberEntity, 'id' | 'joinedAt'>): Promise<WorkspaceMemberEntity>;
  delete(id: string): Promise<void>;
}

export interface DocumentRepositoryPort {
  findById(id: string): Promise<DocumentEntity | null>;
  listByWorkspace(workspaceId: string, page: number, limit: number): Promise<{ items: DocumentEntity[]; total: number }>;
  create(doc: Omit<DocumentEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentEntity>;
  update(id: string, data: Partial<DocumentEntity>): Promise<DocumentEntity>;
  delete(id: string): Promise<void>;
  search(workspaceId: string, query: string): Promise<DocumentEntity[]>;
}

export interface DocumentChunkRepositoryPort {
  findByDocumentId(documentId: string): Promise<DocumentChunkEntity[]>;
  create(chunk: Omit<DocumentChunkEntity, 'id'>): Promise<DocumentChunkEntity>;
  deleteByDocumentId(documentId: string): Promise<void>;
  semanticSearch(workspaceId: string, queryEmbedding: number[], limit: number): Promise<DocumentChunkEntity[]>;
}

export interface ConversationRepositoryPort {
  findById(id: string): Promise<ConversationEntity | null>;
  listByWorkspace(workspaceId: string, userId: string): Promise<ConversationEntity[]>;
  create(conv: Omit<ConversationEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConversationEntity>;
  update(id: string, data: Partial<ConversationEntity>): Promise<ConversationEntity>;
  delete(id: string): Promise<void>;
}

export interface MessageRepositoryPort {
  listByConversation(conversationId: string): Promise<MessageEntity[]>;
  create(msg: Omit<MessageEntity, 'id' | 'createdAt'>): Promise<MessageEntity>;
}

export interface ApiKeyRepositoryPort {
  findById(id: string): Promise<ApiKeyEntity | null>;
  findByKeyHash(keyHash: string): Promise<ApiKeyEntity | null>;
  listByWorkspace(workspaceId: string): Promise<ApiKeyEntity[]>;
  create(key: Omit<ApiKeyEntity, 'id' | 'createdAt'>): Promise<ApiKeyEntity>;
  delete(id: string): Promise<void>;
  updateLastUsed(id: string): Promise<void>;
}

export interface ActivityLogRepositoryPort {
  listByWorkspace(workspaceId: string, page: number, limit: number): Promise<{ items: ActivityLogEntity[]; total: number }>;
  create(log: Omit<ActivityLogEntity, 'id' | 'createdAt'>): Promise<ActivityLogEntity>;
}

export interface AnalyticsRepositoryPort {
  getByWorkspace(workspaceId: string, days: number): Promise<AnalyticsSnapshotEntity[]>;
  upsert(snapshot: Omit<AnalyticsSnapshotEntity, 'id'>): Promise<AnalyticsSnapshotEntity>;
  getSummary(workspaceId: string): Promise<{
    totalDocuments: number;
    totalQueries: number;
    totalTokens: number;
    activeMembers: number;
  }>;
}

export interface IntegrationRepositoryPort {
  listByWorkspace(workspaceId: string): Promise<IntegrationEntity[]>;
  findByProvider(workspaceId: string, provider: IntegrationEntity['provider']): Promise<IntegrationEntity | null>;
  upsert(integration: Omit<IntegrationEntity, 'id'>): Promise<IntegrationEntity>;
}

export interface RepositoryBundle {
  users: UserRepositoryPort;
  workspaces: WorkspaceRepositoryPort;
  workspaceMembers: WorkspaceMemberRepositoryPort;
  documents: DocumentRepositoryPort;
  documentChunks: DocumentChunkRepositoryPort;
  conversations: ConversationRepositoryPort;
  messages: MessageRepositoryPort;
  apiKeys: ApiKeyRepositoryPort;
  activityLogs: ActivityLogRepositoryPort;
  analytics: AnalyticsRepositoryPort;
  integrations: IntegrationRepositoryPort;
}
