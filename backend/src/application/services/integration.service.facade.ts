import type { RepositoryBundle } from '../../domain/ports/repository.port.js';
import type { IntegrationEntity } from '../../domain/entities/index.js';
import { ForbiddenError } from '../../shared/errors/domain-errors.js';

export class IntegrationServiceFacade {
  constructor(private readonly repos: RepositoryBundle) {}

  async list(workspaceId: string, userId: string) {
    await this.assertMembership(workspaceId, userId);
    const integrations = await this.repos.integrations.listByWorkspace(workspaceId);
    const providers = ['slack', 'notion', 'google_drive', 'github'] as const;
    return providers.map((provider) => {
      const existing = integrations.find((i) => i.provider === provider);
      return {
        provider,
        status: existing?.status ?? 'disconnected',
        connectedAt: existing?.connectedAt ?? null,
      };
    });
  }

  async connect(workspaceId: string, userId: string, provider: IntegrationEntity['provider']) {
    await this.assertMembership(workspaceId, userId, ['owner', 'admin']);
    const integration = await this.repos.integrations.upsert({
      workspaceId,
      provider,
      status: 'connected',
      config: JSON.stringify({ connectedBy: userId }),
      connectedAt: new Date().toISOString(),
    });
    return { provider: integration.provider, status: integration.status, connectedAt: integration.connectedAt };
  }

  async disconnect(workspaceId: string, userId: string, provider: IntegrationEntity['provider']) {
    await this.assertMembership(workspaceId, userId, ['owner', 'admin']);
    await this.repos.integrations.upsert({
      workspaceId,
      provider,
      status: 'disconnected',
      config: '{}',
      connectedAt: null,
    });
  }

  private async assertMembership(workspaceId: string, userId: string, roles?: string[]) {
    const member = await this.repos.workspaceMembers.findByWorkspaceAndUser(workspaceId, userId);
    if (!member) throw new ForbiddenError('Not a workspace member');
    if (roles && !roles.includes(member.role)) throw new ForbiddenError('Insufficient permissions');
  }
}
