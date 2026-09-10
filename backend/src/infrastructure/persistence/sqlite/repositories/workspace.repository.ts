import { v4 as uuidv4 } from 'uuid';
import type { WorkspaceEntity, WorkspaceMemberEntity } from '../../../../domain/entities/index.js';
import type { WorkspaceRepositoryPort, WorkspaceMemberRepositoryPort } from '../../../../domain/ports/repository.port.js';
import { getDatabase } from '../database-connection.js';
import { asRow, asRows } from '../db-row.js';

interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: WorkspaceEntity['plan'];
  created_at: string;
  updated_at: string;
}

interface MemberRow {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceMemberEntity['role'];
  joined_at: string;
}

function mapWorkspace(row: WorkspaceRow): WorkspaceEntity {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerId: row.owner_id,
    plan: row.plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMember(row: MemberRow): WorkspaceMemberEntity {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

export class SqliteWorkspaceRepository implements WorkspaceRepositoryPort {
  findById(id: string): Promise<WorkspaceEntity | null> {
    const row = asRow<WorkspaceRow | undefined>(getDatabase().prepare('SELECT * FROM workspaces WHERE id = ?').get(id));
    return Promise.resolve(row ? mapWorkspace(row) : null);
  }

  findBySlug(slug: string): Promise<WorkspaceEntity | null> {
    const row = asRow<WorkspaceRow | undefined>(getDatabase().prepare('SELECT * FROM workspaces WHERE slug = ?').get(slug));
    return Promise.resolve(row ? mapWorkspace(row) : null);
  }

  findByUserId(userId: string): Promise<WorkspaceEntity[]> {
    const rows = asRows<WorkspaceRow>(getDatabase().prepare(`
      SELECT w.* FROM workspaces w
      JOIN workspace_members wm ON wm.workspace_id = w.id
      WHERE wm.user_id = ?
    `).all(userId));
    return Promise.resolve(rows.map(mapWorkspace));
  }

  async create(workspace: Omit<WorkspaceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkspaceEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    getDatabase().prepare(`
      INSERT INTO workspaces (id, name, slug, owner_id, plan, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, workspace.name, workspace.slug, workspace.ownerId, workspace.plan, now, now);
    return (await this.findById(id))!;
  }

  async update(id: string, data: Partial<WorkspaceEntity>): Promise<WorkspaceEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Workspace not found');
    const now = new Date().toISOString();
    getDatabase().prepare(`
      UPDATE workspaces SET name = ?, plan = ?, updated_at = ? WHERE id = ?
    `).run(data.name ?? existing.name, data.plan ?? existing.plan, now, id);
    return (await this.findById(id))!;
  }
}

export class SqliteWorkspaceMemberRepository implements WorkspaceMemberRepositoryPort {
  findByWorkspaceAndUser(workspaceId: string, userId: string): Promise<WorkspaceMemberEntity | null> {
    const row = asRow<MemberRow | undefined>(getDatabase().prepare(`
      SELECT * FROM workspace_members WHERE workspace_id = ? AND user_id = ?
    `).get(workspaceId, userId));
    return Promise.resolve(row ? mapMember(row) : null);
  }

  listByWorkspace(workspaceId: string): Promise<WorkspaceMemberEntity[]> {
    const rows = asRows<MemberRow>(getDatabase().prepare('SELECT * FROM workspace_members WHERE workspace_id = ?').all(workspaceId));
    return Promise.resolve(rows.map(mapMember));
  }

  async create(member: Omit<WorkspaceMemberEntity, 'id' | 'joinedAt'>): Promise<WorkspaceMemberEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    getDatabase().prepare(`
      INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, member.workspaceId, member.userId, member.role, now);
    const row = asRow<MemberRow>(getDatabase().prepare('SELECT * FROM workspace_members WHERE id = ?').get(id));
    return mapMember(row);
  }

  delete(id: string): Promise<void> {
    getDatabase().prepare('DELETE FROM workspace_members WHERE id = ?').run(id);
    return Promise.resolve();
  }
}
