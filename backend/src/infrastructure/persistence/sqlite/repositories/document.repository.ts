import { v4 as uuidv4 } from 'uuid';
import type { DocumentEntity, DocumentChunkEntity } from '../../../../domain/entities/index.js';
import type { DocumentRepositoryPort, DocumentChunkRepositoryPort } from '../../../../domain/ports/repository.port.js';
import { getDatabase } from '../database-connection.js';
import { asRow, asRows } from '../db-row.js';

interface DocumentRow {
  id: string;
  workspace_id: string;
  uploaded_by: string;
  title: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: DocumentEntity['status'];
  chunk_count: number;
  summary: string | null;
  tags: string;
  created_at: string;
  updated_at: string;
}

interface ChunkRow {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  token_count: number;
  embedding: string | null;
}

function mapDocument(row: DocumentRow): DocumentEntity {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    uploadedBy: row.uploaded_by,
    title: row.title,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    status: row.status,
    chunkCount: row.chunk_count,
    summary: row.summary,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChunk(row: ChunkRow): DocumentChunkEntity {
  return {
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    chunkIndex: row.chunk_index,
    tokenCount: row.token_count,
    embedding: row.embedding,
  };
}

export class SqliteDocumentRepository implements DocumentRepositoryPort {
  findById(id: string): Promise<DocumentEntity | null> {
    const row = asRow<DocumentRow | undefined>(getDatabase().prepare('SELECT * FROM documents WHERE id = ?').get(id));
    return Promise.resolve(row ? mapDocument(row) : null);
  }

  listByWorkspace(workspaceId: string, page: number, limit: number): Promise<{ items: DocumentEntity[]; total: number }> {
    const offset = (page - 1) * limit;
    const total = asRow<{ count: number }>(getDatabase().prepare('SELECT COUNT(*) as count FROM documents WHERE workspace_id = ?').get(workspaceId)).count;
    const rows = asRows<DocumentRow>(getDatabase().prepare(`
      SELECT * FROM documents WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(workspaceId, limit, offset));
    return Promise.resolve({ items: rows.map(mapDocument), total });
  }

  async create(doc: Omit<DocumentEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    getDatabase().prepare(`
      INSERT INTO documents (id, workspace_id, uploaded_by, title, filename, mime_type, size_bytes, status, chunk_count, summary, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, doc.workspaceId, doc.uploadedBy, doc.title, doc.filename, doc.mimeType, doc.sizeBytes, doc.status, doc.chunkCount, doc.summary, doc.tags, now, now);
    return (await this.findById(id))!;
  }

  async update(id: string, data: Partial<DocumentEntity>): Promise<DocumentEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Document not found');
    const now = new Date().toISOString();
    getDatabase().prepare(`
      UPDATE documents SET title = ?, status = ?, chunk_count = ?, summary = ?, tags = ?, updated_at = ? WHERE id = ?
    `).run(
      data.title ?? existing.title,
      data.status ?? existing.status,
      data.chunkCount ?? existing.chunkCount,
      data.summary !== undefined ? data.summary : existing.summary,
      data.tags ?? existing.tags,
      now,
      id
    );
    return (await this.findById(id))!;
  }

  delete(id: string): Promise<void> {
    getDatabase().prepare('DELETE FROM documents WHERE id = ?').run(id);
    return Promise.resolve();
  }

  search(workspaceId: string, query: string): Promise<DocumentEntity[]> {
    const rows = asRows<DocumentRow>(getDatabase().prepare(`
      SELECT * FROM documents WHERE workspace_id = ? AND (title LIKE ? OR summary LIKE ?)
      ORDER BY created_at DESC LIMIT 20
    `).all(workspaceId, `%${query}%`, `%${query}%`));
    return Promise.resolve(rows.map(mapDocument));
  }
}

export class SqliteDocumentChunkRepository implements DocumentChunkRepositoryPort {
  findByDocumentId(documentId: string): Promise<DocumentChunkEntity[]> {
    const rows = asRows<ChunkRow>(getDatabase().prepare('SELECT * FROM document_chunks WHERE document_id = ? ORDER BY chunk_index').all(documentId));
    return Promise.resolve(rows.map(mapChunk));
  }

  async create(chunk: Omit<DocumentChunkEntity, 'id'>): Promise<DocumentChunkEntity> {
    const id = uuidv4();
    getDatabase().prepare(`
      INSERT INTO document_chunks (id, document_id, content, chunk_index, token_count, embedding)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, chunk.documentId, chunk.content, chunk.chunkIndex, chunk.tokenCount, chunk.embedding);
    const row = asRow<ChunkRow>(getDatabase().prepare('SELECT * FROM document_chunks WHERE id = ?').get(id));
    return mapChunk(row);
  }

  deleteByDocumentId(documentId: string): Promise<void> {
    getDatabase().prepare('DELETE FROM document_chunks WHERE document_id = ?').run(documentId);
    return Promise.resolve();
  }

  semanticSearch(workspaceId: string, _queryEmbedding: number[], limit: number): Promise<DocumentChunkEntity[]> {
    const rows = asRows<ChunkRow>(getDatabase().prepare(`
      SELECT dc.* FROM document_chunks dc
      JOIN documents d ON d.id = dc.document_id
      WHERE d.workspace_id = ? AND d.status = 'indexed'
      ORDER BY dc.chunk_index LIMIT ?
    `).all(workspaceId, limit));
    return Promise.resolve(rows.map(mapChunk));
  }
}
