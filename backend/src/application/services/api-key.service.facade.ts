import { v4 as uuidv4 } from 'uuid';
import { createHash, randomBytes } from 'node:crypto';
import type { RepositoryBundle } from '../../domain/ports/repository.port.js';
import type { AuthTokenPort } from '../../domain/ports/infrastructure.port.js';
import { ForbiddenError } from '../../shared/errors/domain-errors.js';

export class ApiKeyServiceFacade {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly auth: AuthTokenPort
  ) {}

  async list(workspaceId: string, userId: string) {
    await this.assertMembership(workspaceId, userId);
    const keys = await this.repos.apiKeys.listByWorkspace(workspaceId);
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
    }));
  }

  async create(workspaceId: string, userId: string, name: string) {
    await this.assertMembership(workspaceId, userId, ['owner', 'admin']);
    const rawKey = `sk_siq_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12) + '...';

    const apiKey = await this.repos.apiKeys.create({
      workspaceId,
      userId,
      name,
      keyHash,
      keyPrefix,
      lastUsedAt: null,
      expiresAt: null,
    });

    return { id: apiKey.id, name: apiKey.name, key: rawKey, keyPrefix: apiKey.keyPrefix, createdAt: apiKey.createdAt };
  }

  async revoke(keyId: string, userId: string) {
    const key = await this.repos.apiKeys.findById(keyId);
    if (!key) throw new ForbiddenError('API key not found');
    await this.assertMembership(key.workspaceId, userId, ['owner', 'admin']);
    await this.repos.apiKeys.delete(keyId);
  }

  private async assertMembership(workspaceId: string, userId: string, roles?: string[]) {
    const member = await this.repos.workspaceMembers.findByWorkspaceAndUser(workspaceId, userId);
    if (!member) throw new ForbiddenError('Not a workspace member');
    if (roles && !roles.includes(member.role)) throw new ForbiddenError('Insufficient permissions');
  }
}
