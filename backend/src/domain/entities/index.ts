export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl: string | null;
  role: 'admin' | 'member' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceEntity {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberEntity {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export interface DocumentEntity {
  id: string;
  workspaceId: string;
  uploadedBy: string;
  title: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: 'pending' | 'processing' | 'indexed' | 'failed';
  chunkCount: number;
  summary: string | null;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunkEntity {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  embedding: string | null;
}

export interface ConversationEntity {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageEntity {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount: number;
  sources: string;
  createdAt: string;
}

export interface ApiKeyEntity {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ActivityLogEntity {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: string;
  createdAt: string;
}

export interface AnalyticsSnapshotEntity {
  id: string;
  workspaceId: string;
  date: string;
  documentsProcessed: number;
  queriesExecuted: number;
  tokensConsumed: number;
  activeUsers: number;
}

export interface IntegrationEntity {
  id: string;
  workspaceId: string;
  provider: 'slack' | 'notion' | 'google_drive' | 'github';
  status: 'connected' | 'disconnected' | 'error';
  config: string;
  connectedAt: string | null;
}
