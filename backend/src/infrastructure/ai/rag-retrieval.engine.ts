import type { RepositoryBundle } from '../../domain/ports/repository.port.js';
import type { AiProviderPort } from '../../domain/ports/infrastructure.port.js';
import type { DocumentChunkEntity } from '../../domain/entities/index.js';

export interface RetrievalContext {
  chunks: DocumentChunkEntity[];
  contextText: string;
  sourceDocumentIds: string[];
}

export class RagRetrievalEngine {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly ai: AiProviderPort
  ) {}

  async retrieve(workspaceId: string, query: string, topK = 5): Promise<RetrievalContext> {
    const { embedding } = await this.ai.embed(query);
    const chunks = await this.repos.documentChunks.semanticSearch(workspaceId, embedding, topK);

    const sourceDocumentIds = [...new Set(chunks.map((c) => c.documentId))];
    const contextText = chunks.map((c, i) => `[Source ${i + 1}]\n${c.content}`).join('\n\n---\n\n');

    return { chunks, contextText, sourceDocumentIds };
  }

  buildSystemPrompt(): string {
    return `You are SynapseIQ, an enterprise AI knowledge assistant. Answer questions based on the provided context from the user's knowledge base. Be precise, cite sources when possible, and acknowledge when information is not in the context. Format responses with markdown when helpful.`;
  }
}
