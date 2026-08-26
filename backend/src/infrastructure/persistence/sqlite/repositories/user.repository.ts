import { v4 as uuidv4 } from 'uuid';
import type { UserEntity } from '../../../../domain/entities/index.js';
import type { UserRepositoryPort } from '../../../../domain/ports/repository.port.js';
import { getDatabase } from '../database-connection.js';
import { asRow, asRows } from '../db-row.js';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_url: string | null;
  role: UserEntity['role'];
  created_at: string;
  updated_at: string;
}

function mapRow(row: UserRow): UserEntity {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteUserRepository implements UserRepositoryPort {
  findById(id: string): Promise<UserEntity | null> {
    const row = asRow<UserRow | undefined>(getDatabase().prepare('SELECT * FROM users WHERE id = ?').get(id));
    return Promise.resolve(row ? mapRow(row) : null);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    const row = asRow<UserRow | undefined>(getDatabase().prepare('SELECT * FROM users WHERE email = ?').get(email));
    return Promise.resolve(row ? mapRow(row) : null);
  }

  async create(user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    getDatabase().prepare(`
      INSERT INTO users (id, email, password_hash, full_name, avatar_url, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.email, user.passwordHash, user.fullName, user.avatarUrl, user.role, now, now);
    return (await this.findById(id))!;
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('User not found');
    const now = new Date().toISOString();
    getDatabase().prepare(`
      UPDATE users SET email = ?, full_name = ?, avatar_url = ?, role = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.email ?? existing.email,
      data.fullName ?? existing.fullName,
      data.avatarUrl !== undefined ? data.avatarUrl : existing.avatarUrl,
      data.role ?? existing.role,
      now,
      id
    );
    return (await this.findById(id))!;
  }

  listByWorkspace(workspaceId: string): Promise<UserEntity[]> {
    const rows = asRows<UserRow>(getDatabase().prepare(`
      SELECT u.* FROM users u
      JOIN workspace_members wm ON wm.user_id = u.id
      WHERE wm.workspace_id = ?
    `).all(workspaceId));
    return Promise.resolve(rows.map(mapRow));
  }
}
