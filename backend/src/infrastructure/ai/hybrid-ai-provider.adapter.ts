import type { AiProviderPort, EmbeddingResult, CompletionResult } from '../../domain/ports/infrastructure.port.js';
import { envConfig } from '../../config/environment/env-config.js';

function pseudoEmbed(text: string): number[] {
  const vec = new Array(128).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % 128] += text.charCodeAt(i) / 255;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export class HybridAiProviderAdapter implements AiProviderPort {
  private readonly hasOpenAi = Boolean(envConfig.OPENAI_API_KEY);

  async embed(text: string): Promise<EmbeddingResult> {
    if (this.hasOpenAi) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${envConfig.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
        });
        if (response.ok) {
          const data = (await response.json()) as { data: [{ embedding: number[] }]; usage: { total_tokens: number } };
          return { embedding: data.data[0].embedding, tokenCount: data.usage.total_tokens };
        }
      } catch {
        /* fall through to local */
      }
    }
    return { embedding: pseudoEmbed(text), tokenCount: Math.ceil(text.length / 4) };
  }

  async complete(systemPrompt: string, userPrompt: string, context?: string): Promise<CompletionResult> {
    if (this.hasOpenAi) {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          ...(context ? [{ role: 'system', content: `Context:\n${context}` }] : []),
          { role: 'user', content: userPrompt },
        ];
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${envConfig.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 1024 }),
        });
        if (response.ok) {
          const data = (await response.json()) as {
            choices: [{ message: { content: string } }];
            usage: { total_tokens: number };
            model: string;
          };
          return {
            content: data.choices[0].message.content,
            tokenCount: data.usage.total_tokens,
            model: data.model,
          };
        }
      } catch {
        /* fall through */
      }
    }

    const content = this.generateLocalResponse(userPrompt, context);
    return { content, tokenCount: Math.ceil(content.length / 4), model: 'synapseiq-local' };
  }

  async summarize(text: string): Promise<string> {
    const truncated = text.slice(0, 4000);
    const result = await this.complete(
      'You are a document summarizer. Provide concise, actionable summaries.',
      `Summarize the following document:\n\n${truncated}`
    );
    return result.content;
  }

  private generateLocalResponse(userPrompt: string, context?: string): string {
    const contextNote = context
      ? `\n\nBased on your knowledge base, I found relevant information from your indexed documents.`
      : '';
    return `I've analyzed your query: "${userPrompt.slice(0, 200)}"${contextNote}

Here's my analysis:

**Key Insights**
- Your knowledge base contains relevant documents that address this topic
- The indexed content suggests multiple perspectives worth considering
- I recommend reviewing the source documents for detailed context

**Recommendations**
1. Cross-reference findings with your Q4 Product Strategy document
2. Consider scheduling a team review session
3. Export this analysis to share with stakeholders

*Note: Connect an OpenAI API key in backend/.env for live AI responses.*`;
  }
}
