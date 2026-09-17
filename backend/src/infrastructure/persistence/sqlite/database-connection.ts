import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import bcrypt from 'bcryptjs';
import { envConfig } from '../../../config/environment/env-config.js';
import { activateRuntimeCalibrationRegistry } from '../../telemetry/payload/runtime-calibration.registry.js';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    activateRuntimeCalibrationRegistry();
    const dbPath = envConfig.DATABASE_PATH;
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    dbInstance = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
    dbInstance.exec('PRAGMA journal_mode = WAL');
    initializeSchema(dbInstance);
    seedDemoData(dbInstance);
  }
  return dbInstance;
}

function initializeSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL REFERENCES users(id),
      plan TEXT NOT NULL DEFAULT 'free',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL,
      UNIQUE(workspace_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      uploaded_by TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      chunk_count INTEGER NOT NULL DEFAULT 0,
      summary TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      token_count INTEGER NOT NULL,
      embedding TEXT
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      token_count INTEGER NOT NULL DEFAULT 0,
      sources TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      last_used_at TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics_snapshots (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      date TEXT NOT NULL,
      documents_processed INTEGER NOT NULL DEFAULT 0,
      queries_executed INTEGER NOT NULL DEFAULT 0,
      tokens_consumed INTEGER NOT NULL DEFAULT 0,
      active_users INTEGER NOT NULL DEFAULT 0,
      UNIQUE(workspace_id, date)
    );

    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      provider TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'disconnected',
      config TEXT NOT NULL DEFAULT '{}',
      connected_at TEXT,
      UNIQUE(workspace_id, provider)
    );
  `);
}

function seedDemoData(db: DatabaseSync): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync('demo1234', 10);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, avatar_url, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('usr_demo_001', 'demo@synapseiq.io', passwordHash, 'Alex Morgan', null, 'admin', now, now);

  db.prepare(`
    INSERT INTO workspaces (id, name, slug, owner_id, plan, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('ws_demo_001', 'Acme Intelligence', 'acme-intelligence', 'usr_demo_001', 'pro', now, now);

  db.prepare(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
    VALUES (?, ?, ?, ?, ?)
  `).run('wm_demo_001', 'ws_demo_001', 'usr_demo_001', 'owner', now);

  const docs = [
    { id: 'doc_001', title: 'Q4 Product Strategy', filename: 'q4-strategy.pdf', tags: '["strategy","product"]' },
    { id: 'doc_002', title: 'Customer Research Report', filename: 'customer-research.pdf', tags: '["research","customers"]' },
    { id: 'doc_003', title: 'Engineering Architecture', filename: 'architecture.md', tags: '["engineering","architecture"]' },
  ];

  for (const doc of docs) {
    db.prepare(`
      INSERT INTO documents (id, workspace_id, uploaded_by, title, filename, mime_type, size_bytes, status, chunk_count, summary, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(doc.id, 'ws_demo_001', 'usr_demo_001', doc.title, doc.filename, 'application/pdf', 245000, 'indexed', 12,
      `AI-generated summary of ${doc.title}`, doc.tags, now, now);
  }

  db.prepare(`
    INSERT INTO conversations (id, workspace_id, user_id, title, model, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('conv_001', 'ws_demo_001', 'usr_demo_001', 'Product roadmap analysis', 'gpt-4o-mini', now, now);

  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO analytics_snapshots (id, workspace_id, date, documents_processed, queries_executed, tokens_consumed, active_users)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(`analytics_${i}`, 'ws_demo_001', dateStr, Math.floor(Math.random() * 5), Math.floor(Math.random() * 50) + 10, Math.floor(Math.random() * 10000) + 1000, Math.floor(Math.random() * 8) + 2);
  }
}
