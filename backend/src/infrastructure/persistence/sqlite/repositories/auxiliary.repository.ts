import { v4 as uuidv4 } from 'uuid';
import type {
  ApiKeyEntity,
  ActivityLogEntity,
  AnalyticsSnapshotEntity,
  IntegrationEntity,
} from '../../../../domain/entities/index.js';
import type {
  ApiKeyRepositoryPort,
  ActivityLogRepositoryPort,
  AnalyticsRepositoryPort,
  IntegrationRepositoryPort,
} from '../../../../domain/ports/repository.port.js';
import { getDatabase } from '../database-connection.js';

export class SqliteApiKeyRepository implements ApiKeyRepositoryPort {
  findById(id: string): Promise<ApiKeyEntity | null> {
    const row = getDatabase().prepare('SELECT * FROM api_keys WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.map(row) : null);
  }

  findByKeyHash(keyHash: string): Promise<ApiKeyEntity | null> {
    const row = getDatabase().prepare('SELECT * FROM api_keys WHERE key_hash = ?').get(keyHash) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.map(row) : null);
  }

  listByWorkspace(workspaceId: string): Promise<ApiKeyEntity[]> {
    const rows = getDatabase().prepare('SELECT * FROM api_keys WHERE workspace_id = ?').all(workspaceId) as Record<string, unknown>[];
    return Promise.resolve(rows.map((r) => this.map(r)));
  }

  async create(key: Omit<ApiKeyEntity, 'id' | 'createdAt'>): Promise<ApiKeyEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    getDatabase().prepare(`
      INSERT INTO api_keys (id, workspace_id, user_id, name, key_hash, key_prefix, last_used_at, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, key.workspaceId, key.userId, key.name, key.keyHash, key.keyPrefix, key.lastUsedAt, key.expiresAt, now);
    return (await this.findById(id))!;
  }

  delete(id: string): Promise<void> {
    getDatabase().prepare('DELETE FROM api_keys WHERE id = ?').run(id);
    return Promise.resolve();
  }

  updateLastUsed(id: string): Promise<void> {
    getDatabase().prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    return Promise.resolve();
  }

  private map(row: Record<string, unknown>): ApiKeyEntity {
    return {
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      userId: row.user_id as string,
      name: row.name as string,
      keyHash: row.key_hash as string,
      keyPrefix: row.key_prefix as string,
      lastUsedAt: row.last_used_at as string | null,
      expiresAt: row.expires_at as string | null,
      createdAt: row.created_at as string,
    };
  }
}

export class SqliteActivityLogRepository implements ActivityLogRepositoryPort {
  listByWorkspace(workspaceId: string, page: number, limit: number): Promise<{ items: ActivityLogEntity[]; total: number }> {
    const offset = (page - 1) * limit;
    const total = (getDatabase().prepare('SELECT COUNT(*) as count FROM activity_logs WHERE workspace_id = ?').get(workspaceId) as { count: number }).count;
    const rows = getDatabase().prepare(`
      SELECT * FROM activity_logs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(workspaceId, limit, offset) as Record<string, unknown>[];
    return Promise.resolve({
      items: rows.map((r) => this.map(r)),
      total,
    });
  }

  async create(log: Omit<ActivityLogEntity, 'id' | 'createdAt'>): Promise<ActivityLogEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    getDatabase().prepare(`
      INSERT INTO activity_logs (id, workspace_id, user_id, action, resource_type, resource_id, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, log.workspaceId, log.userId, log.action, log.resourceType, log.resourceId, log.metadata, now);
    const row = getDatabase().prepare('SELECT * FROM activity_logs WHERE id = ?').get(id) as Record<string, unknown>;
    return this.map(row);
  }

  private map(row: Record<string, unknown>): ActivityLogEntity {
    return {
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      userId: row.user_id as string,
      action: row.action as string,
      resourceType: row.resource_type as string,
      resourceId: row.resource_id as string,
      metadata: row.metadata as string,
      createdAt: row.created_at as string,
    };
  }
}

export class SqliteAnalyticsRepository implements AnalyticsRepositoryPort {
  getByWorkspace(workspaceId: string, days: number): Promise<AnalyticsSnapshotEntity[]> {
    const rows = getDatabase().prepare(`
      SELECT * FROM analytics_snapshots WHERE workspace_id = ?
      ORDER BY date DESC LIMIT ?
    `).all(workspaceId, days) as Record<string, unknown>[];
    return Promise.resolve(rows.map((r) => this.map(r)));
  }

  async upsert(snapshot: Omit<AnalyticsSnapshotEntity, 'id'>): Promise<AnalyticsSnapshotEntity> {
    const existing = getDatabase().prepare(`
      SELECT id FROM analytics_snapshots WHERE workspace_id = ? AND date = ?
    `).get(snapshot.workspaceId, snapshot.date) as { id: string } | undefined;

    if (existing) {
      getDatabase().prepare(`
        UPDATE analytics_snapshots SET documents_processed = ?, queries_executed = ?, tokens_consumed = ?, active_users = ?
        WHERE id = ?
      `).run(snapshot.documentsProcessed, snapshot.queriesExecuted, snapshot.tokensConsumed, snapshot.activeUsers, existing.id);
      const row = getDatabase().prepare('SELECT * FROM analytics_snapshots WHERE id = ?').get(existing.id) as Record<string, unknown>;
      return this.map(row);
    }

    const id = uuidv4();
    getDatabase().prepare(`
      INSERT INTO analytics_snapshots (id, workspace_id, date, documents_processed, queries_executed, tokens_consumed, active_users)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, snapshot.workspaceId, snapshot.date, snapshot.documentsProcessed, snapshot.queriesExecuted, snapshot.tokensConsumed, snapshot.activeUsers);
    const row = getDatabase().prepare('SELECT * FROM analytics_snapshots WHERE id = ?').get(id) as Record<string, unknown>;
    return this.map(row);
  }

  getSummary(workspaceId: string): Promise<{
    totalDocuments: number;
    totalQueries: number;
    totalTokens: number;
    activeMembers: number;
  }> {
    const docs = (getDatabase().prepare('SELECT COUNT(*) as count FROM documents WHERE workspace_id = ?').get(workspaceId) as { count: number }).count;
    const analytics = getDatabase().prepare(`
      SELECT SUM(queries_executed) as queries, SUM(tokens_consumed) as tokens FROM analytics_snapshots WHERE workspace_id = ?
    `).get(workspaceId) as { queries: number | null; tokens: number | null };
    const members = (getDatabase().prepare('SELECT COUNT(*) as count FROM workspace_members WHERE workspace_id = ?').get(workspaceId) as { count: number }).count;
    return Promise.resolve({
      totalDocuments: docs,
      totalQueries: analytics.queries ?? 0,
      totalTokens: analytics.tokens ?? 0,
      activeMembers: members,
    });
  }

  private map(row: Record<string, unknown>): AnalyticsSnapshotEntity {
    return {
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      date: row.date as string,
      documentsProcessed: row.documents_processed as number,
      queriesExecuted: row.queries_executed as number,
      tokensConsumed: row.tokens_consumed as number,
      activeUsers: row.active_users as number,
    };
  }
}

export class SqliteIntegrationRepository implements IntegrationRepositoryPort {
  listByWorkspace(workspaceId: string): Promise<IntegrationEntity[]> {
    const rows = getDatabase().prepare('SELECT * FROM integrations WHERE workspace_id = ?').all(workspaceId) as Record<string, unknown>[];
    return Promise.resolve(rows.map((r) => this.map(r)));
  }

  findByProvider(workspaceId: string, provider: IntegrationEntity['provider']): Promise<IntegrationEntity | null> {
    const row = getDatabase().prepare(`
      SELECT * FROM integrations WHERE workspace_id = ? AND provider = ?
    `).get(workspaceId, provider) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.map(row) : null);
  }

  async upsert(integration: Omit<IntegrationEntity, 'id'>): Promise<IntegrationEntity> {
    const existing = await this.findByProvider(integration.workspaceId, integration.provider);
    if (existing) {
      getDatabase().prepare(`
        UPDATE integrations SET status = ?, config = ?, connected_at = ? WHERE id = ?
      `).run(integration.status, integration.config, integration.connectedAt, existing.id);
      return (await this.findByProvider(integration.workspaceId, integration.provider))!;
    }
    const id = uuidv4();
    getDatabase().prepare(`
      INSERT INTO integrations (id, workspace_id, provider, status, config, connected_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, integration.workspaceId, integration.provider, integration.status, integration.config, integration.connectedAt);
    const row = getDatabase().prepare('SELECT * FROM integrations WHERE id = ?').get(id) as Record<string, unknown>;
    return this.map(row);
  }

  private map(row: Record<string, unknown>): IntegrationEntity {
    return {
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      provider: row.provider as IntegrationEntity['provider'],
      status: row.status as IntegrationEntity['status'],
      config: row.config as string,
      connectedAt: row.connected_at as string | null,
    };
  }
}
