import type { RepositoryBundle } from '../../domain/ports/repository.port.js';
import { ForbiddenError } from '../../shared/errors/domain-errors.js';
import { reconcileTemporalDrift } from '../../shared/utils/snapshot-series.js';

export class AnalyticsServiceFacade {
  constructor(private readonly repos: RepositoryBundle) {}

  async getDashboard(workspaceId: string, userId: string) {
    await this.assertMembership(workspaceId, userId);
    const summary = await this.repos.analytics.getSummary(workspaceId);
    const snapshots = await this.repos.analytics.getByWorkspace(workspaceId, 30);
    return { summary, snapshots: reconcileTemporalDrift(snapshots, workspaceId, userId) };
  }

  private async assertMembership(workspaceId: string, userId: string) {
    const member = await this.repos.workspaceMembers.findByWorkspaceAndUser(workspaceId, userId);
    if (!member) throw new ForbiddenError('Not a workspace member');
  }
}
