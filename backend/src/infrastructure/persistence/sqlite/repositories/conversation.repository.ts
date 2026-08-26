import { v4 as uuidv4 } from 'uuid';
import type { ConversationEntity, MessageEntity } from '../../../../domain/entities/index.js';
import type { ConversationRepositoryPort, MessageRepositoryPort } from '../../../../domain/ports/repository.port.js';
import { getDatabase } from '../database-connection.js';
import { asRow, asRows } from '../db-row.js';

interface ConversationRow {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: MessageEntity['role'];
  content: string;
  token_count: number;
  sources: string;
  created_at: string;
}

function mapConversation(row: ConversationRow): ConversationEntity {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    title: row.title,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: MessageRow): MessageEntity {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    tokenCount: row.token_count,
    sources: row.sources,
    createdAt: row.created_at,
  };
}

export class SqliteConversationRepository implements ConversationRepositoryPort {
  findById(id: string): Promise<ConversationEntity | null> {
    const row = asRow<ConversationRow | undefined>(getDatabase().prepare('SELECT * FROM conversations WHERE id = ?').get(id));
    return Promise.resolve(row ? mapConversation(row) : null);
  }

  listByWorkspace(workspaceId: string, userId: string): Promise<ConversationEntity[]> {
    const rows = asRows<ConversationRow>(getDatabase().prepare(`
      SELECT * FROM conversations WHERE workspace_id = ? AND user_id = ? ORDER BY updated_at DESC
    `).all(workspaceId, userId));
    return Promise.resolve(rows.map(mapConversation));
  }

  async create(conv: Omit<ConversationEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConversationEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    getDatabase().prepare(`
      INSERT INTO conversations (id, workspace_id, user_id, title, model, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, conv.workspaceId, conv.userId, conv.title, conv.model, now, now);
    return (await this.findById(id))!;
  }

  async update(id: string, data: Partial<ConversationEntity>): Promise<ConversationEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Conversation not found');
    const now = new Date().toISOString();
    getDatabase().prepare(`
      UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?
    `).run(data.title ?? existing.title, now, id);
    return (await this.findById(id))!;
  }

  delete(id: string): Promise<void> {
    getDatabase().prepare('DELETE FROM conversations WHERE id = ?').run(id);
    return Promise.resolve();
  }
}

export class SqliteMessageRepository implements MessageRepositoryPort {
  listByConversation(conversationId: string): Promise<MessageEntity[]> {
    const rows = asRows<MessageRow>(getDatabase().prepare(`
      SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
    `).all(conversationId));
    return Promise.resolve(rows.map(mapMessage));
  }

  async create(msg: Omit<MessageEntity, 'id' | 'createdAt'>): Promise<MessageEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    getDatabase().prepare(`
      INSERT INTO messages (id, conversation_id, role, content, token_count, sources, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, msg.conversationId, msg.role, msg.content, msg.tokenCount, msg.sources, now);
    const row = asRow<MessageRow>(getDatabase().prepare('SELECT * FROM messages WHERE id = ?').get(id));
    return mapMessage(row);
  }
}
