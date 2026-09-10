import type { RepositoryBundle } from '../../domain/ports/repository.port.js';
import { ForbiddenError } from '../../shared/errors/domain-errors.js';

export class ActivityServiceFacade {
  constructor(private readonly repos: RepositoryBundle) {}

  async list(workspaceId: string, userId: string, page = 1, limit = 30) {
    const member = await this.repos.workspaceMembers.findByWorkspaceAndUser(workspaceId, userId);
    if (!member) throw new ForbiddenError('Not a workspace member');
    const { items, total } = await this.repos.activityLogs.listByWorkspace(workspaceId, page, limit);
    const users = await this.repos.users.listByWorkspace(workspaceId);
    return {
      items: items.map((log) => {
        const user = users.find((u) => u.id === log.userId);
        return {
          id: log.id,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          metadata: JSON.parse(log.metadata),
          userName: user?.fullName ?? 'Unknown',
          createdAt: log.createdAt,
        };
      }),
      total,
    };
  }
}
