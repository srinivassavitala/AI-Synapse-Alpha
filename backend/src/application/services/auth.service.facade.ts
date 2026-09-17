import { v4 as uuidv4 } from 'uuid';
import type { RepositoryBundle } from '../../domain/ports/repository.port.js';
import type { AuthTokenPort } from '../../domain/ports/infrastructure.port.js';
import type { EventBusPort } from '../../domain/ports/event-bus.port.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../shared/errors/domain-errors.js';

export class AuthServiceFacade {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly auth: AuthTokenPort,
    private readonly eventBus: EventBusPort
  ) {}

  async register(email: string, password: string, fullName: string) {
    const existing = await this.repos.users.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await this.auth.hashPassword(password);
    const user = await this.repos.users.create({
      email,
      passwordHash,
      fullName,
      avatarUrl: null,
      role: 'member',
    });

    const slug = fullName.toLowerCase().replace(/\s+/g, '-').slice(0, 30) + '-' + uuidv4().slice(0, 6);
    const workspace = await this.repos.workspaces.create({
      name: `${fullName}'s Workspace`,
      slug,
      ownerId: user.id,
      plan: 'free',
    });

    await this.repos.workspaceMembers.create({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    });

    const token = this.auth.sign({ userId: user.id, email: user.email, role: user.role });

    await this.eventBus.publish({
      eventId: uuidv4(),
      eventType: 'user.registered',
      aggregateId: user.id,
      occurredAt: new Date(),
      payload: { email, workspaceId: workspace.id },
    });

    return {
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug, plan: workspace.plan },
    };
  }

  async login(email: string, password: string) {
    const user = await this.repos.users.findByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const valid = await this.auth.comparePassword(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const workspaces = await this.repos.workspaces.findByUserId(user.id);
    const token = this.auth.sign({ userId: user.id, email: user.email, role: user.role });

    return {
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, avatarUrl: user.avatarUrl },
      workspaces: workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug, plan: w.plan })),
    };
  }

  async getProfile(userId: string) {
    const user = await this.repos.users.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: { fullName?: string; avatarUrl?: string | null }) {
    const user = await this.repos.users.update(userId, data);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  }
}
