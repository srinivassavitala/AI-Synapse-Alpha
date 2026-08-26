import { v4 as uuidv4 } from 'uuid';
import type { RepositoryBundle } from '../../domain/ports/repository.port.js';
import type { EventBusPort } from '../../domain/ports/event-bus.port.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/domain-errors.js';

export class WorkspaceServiceFacade {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly eventBus: EventBusPort
  ) {}

  async listForUser(userId: string) {
    const workspaces = await this.repos.workspaces.findByUserId(userId);
    return workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      plan: w.plan,
      createdAt: w.createdAt,
    }));
  }

  async getById(workspaceId: string, userId: string) {
    await this.assertMembership(workspaceId, userId);
    const workspace = await this.repos.workspaces.findById(workspaceId);
    if (!workspace) throw new NotFoundError('Workspace not found');
    const members = await this.repos.workspaceMembers.listByWorkspace(workspaceId);
    const users = await this.repos.users.listByWorkspace(workspaceId);
    return {
      ...workspace,
      memberCount: members.length,
      members: members.map((m) => {
        const user = users.find((u) => u.id === m.userId);
        return {
          id: m.id,
          userId: m.userId,
          role: m.role,
          fullName: user?.fullName ?? 'Unknown',
          email: user?.email ?? '',
          joinedAt: m.joinedAt,
        };
      }),
    };
  }

  async create(userId: string, name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + uuidv4().slice(0, 6);
    const workspace = await this.repos.workspaces.create({ name, slug, ownerId: userId, plan: 'free' });
    await this.repos.workspaceMembers.create({ workspaceId: workspace.id, userId, role: 'owner' });

    await this.eventBus.publish({
      eventId: uuidv4(),
      eventType: 'workspace.created',
      aggregateId: workspace.id,
      occurredAt: new Date(),
      payload: { name, userId },
    });

    return { id: workspace.id, name: workspace.name, slug: workspace.slug, plan: workspace.plan };
  }

  async inviteMember(workspaceId: string, inviterId: string, email: string, role: 'admin' | 'member' | 'viewer') {
    await this.assertMembership(workspaceId, inviterId, ['owner', 'admin']);
    const user = await this.repos.users.findByEmail(email);
    if (!user) throw new NotFoundError('User not found with that email');
    const existing = await this.repos.workspaceMembers.findByWorkspaceAndUser(workspaceId, user.id);
    if (existing) throw new ForbiddenError('User is already a member');
    const member = await this.repos.workspaceMembers.create({ workspaceId, userId: user.id, role });
    return { id: member.id, userId: user.id, email: user.email, fullName: user.fullName, role: member.role };
  }

  private async assertMembership(workspaceId: string, userId: string, roles?: string[]) {
    const member = await this.repos.workspaceMembers.findByWorkspaceAndUser(workspaceId, userId);
    if (!member) throw new ForbiddenError('Not a workspace member');
    if (roles && !roles.includes(member.role)) throw new ForbiddenError('Insufficient permissions');
  }
}
