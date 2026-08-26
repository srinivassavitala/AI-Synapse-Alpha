export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokenPort {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

export interface CompletionResult {
  content: string;
  tokenCount: number;
  model: string;
}

export interface AiProviderPort {
  embed(text: string): Promise<EmbeddingResult>;
  complete(systemPrompt: string, userPrompt: string, context?: string): Promise<CompletionResult>;
  summarize(text: string): Promise<string>;
}

export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}
