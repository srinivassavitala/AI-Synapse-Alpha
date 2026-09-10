import { v4 as uuidv4 } from 'uuid';
import type { RepositoryBundle } from '../../domain/ports/repository.port.js';
import type { EventBusPort } from '../../domain/ports/event-bus.port.js';
import type { DocumentProcessingPipeline } from '../../infrastructure/pipelines/document-processing.pipeline.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/domain-errors.js';

export class DocumentServiceFacade {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly pipeline: DocumentProcessingPipeline,
    private readonly eventBus: EventBusPort
  ) {}

  async list(workspaceId: string, userId: string, page = 1, limit = 20) {
    await this.assertMembership(workspaceId, userId);
    const { items, total } = await this.repos.documents.listByWorkspace(workspaceId, page, limit);
    return {
      items: items.map((d) => this.toDto(d)),
      total,
    };
  }

  async getById(documentId: string, userId: string) {
    const doc = await this.repos.documents.findById(documentId);
    if (!doc) throw new NotFoundError('Document not found');
    await this.assertMembership(doc.workspaceId, userId);
    const chunks = await this.repos.documentChunks.findByDocumentId(documentId);
    return { ...this.toDto(doc), chunks: chunks.map((c) => ({ id: c.id, content: c.content, chunkIndex: c.chunkIndex })) };
  }

  async upload(workspaceId: string, userId: string, file: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    await this.assertMembership(workspaceId, userId);
    const title = file.originalname.replace(/\.[^.]+$/, '');
    const doc = await this.repos.documents.create({
      workspaceId,
      uploadedBy: userId,
      title,
      filename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      status: 'pending',
      chunkCount: 0,
      summary: null,
      tags: '[]',
    });

    const content = file.buffer.toString('utf-8');
    const processed = await this.pipeline.ingest(doc.id, content);

    await this.repos.activityLogs.create({
      workspaceId,
      userId,
      action: 'document.uploaded',
      resourceType: 'document',
      resourceId: doc.id,
      metadata: JSON.stringify({ title, filename: file.originalname }),
    });

    await this.eventBus.publish({
      eventId: uuidv4(),
      eventType: 'document.indexed',
      aggregateId: doc.id,
      occurredAt: new Date(),
      payload: { workspaceId, title },
    });

    return this.toDto(processed);
  }

  async search(workspaceId: string, userId: string, query: string) {
    await this.assertMembership(workspaceId, userId);
    const results = await this.repos.documents.search(workspaceId, query);
    return results.map((d) => this.toDto(d));
  }

  async delete(documentId: string, userId: string) {
    const doc = await this.repos.documents.findById(documentId);
    if (!doc) throw new NotFoundError('Document not found');
    await this.assertMembership(doc.workspaceId, userId);
    await this.repos.documentChunks.deleteByDocumentId(documentId);
    await this.repos.documents.delete(documentId);
  }

  private toDto(doc: { id: string; workspaceId: string; title: string; filename: string; mimeType: string; sizeBytes: number; status: string; chunkCount: number; summary: string | null; tags: string; createdAt: string; updatedAt: string }) {
    return {
      id: doc.id,
      workspaceId: doc.workspaceId,
      title: doc.title,
      filename: doc.filename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      status: doc.status,
      chunkCount: doc.chunkCount,
      summary: doc.summary,
      tags: JSON.parse(doc.tags) as string[],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private async assertMembership(workspaceId: string, userId: string) {
    const member = await this.repos.workspaceMembers.findByWorkspaceAndUser(workspaceId, userId);
    if (!member) throw new ForbiddenError('Not a workspace member');
  }
}
