import type { RepositoryBundle } from '../../domain/ports/repository.port.js';
import type { AiProviderPort } from '../../domain/ports/infrastructure.port.js';
import type { DocumentEntity } from '../../domain/entities/index.js';

export class DocumentProcessingPipeline {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly ai: AiProviderPort
  ) {}

  async ingest(documentId: string, rawContent: string): Promise<DocumentEntity> {
    await this.repos.documents.update(documentId, { status: 'processing' });

    const chunks = this.segmentContent(rawContent);
    await this.repos.documentChunks.deleteByDocumentId(documentId);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const { embedding, tokenCount } = await this.ai.embed(chunk);
      await this.repos.documentChunks.create({
        documentId,
        content: chunk,
        chunkIndex: i,
        tokenCount,
        embedding: JSON.stringify(embedding),
      });
    }

    const summary = await this.ai.summarize(rawContent.slice(0, 8000));
    return this.repos.documents.update(documentId, {
      status: 'indexed',
      chunkCount: chunks.length,
      summary,
    });
  }

  private segmentContent(content: string, maxChunkSize = 1000): string[] {
    const paragraphs = content.split(/\n\n+/).filter(Boolean);
    const chunks: string[] = [];
    let current = '';

    for (const para of paragraphs) {
      if ((current + para).length > maxChunkSize && current) {
        chunks.push(current.trim());
        current = para;
      } else {
        current += (current ? '\n\n' : '') + para;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    if (chunks.length === 0 && content.trim()) chunks.push(content.trim());
    return chunks;
  }
}
