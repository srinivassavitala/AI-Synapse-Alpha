import type { InfrastructureBundle } from '../../infrastructure/composition/infrastructure-composer.js';
import type { EventBusPort } from '../../domain/ports/event-bus.port.js';
import { AuthServiceFacade } from '../../application/services/auth.service.facade.js';
import { WorkspaceServiceFacade } from '../../application/services/workspace.service.facade.js';
import { DocumentServiceFacade } from '../../application/services/document.service.facade.js';
import { ConversationServiceFacade } from '../../application/services/conversation.service.facade.js';
import { AnalyticsServiceFacade } from '../../application/services/analytics.service.facade.js';
import { ApiKeyServiceFacade } from '../../application/services/api-key.service.facade.js';
import { IntegrationServiceFacade } from '../../application/services/integration.service.facade.js';
import { ActivityServiceFacade } from '../../application/services/activity.service.facade.js';

export interface ServiceRegistry {
  auth: AuthServiceFacade;
  workspace: WorkspaceServiceFacade;
  document: DocumentServiceFacade;
  conversation: ConversationServiceFacade;
  analytics: AnalyticsServiceFacade;
  apiKey: ApiKeyServiceFacade;
  integration: IntegrationServiceFacade;
  activity: ActivityServiceFacade;
}

export class ServiceRegistryBuilder {
  private infra!: InfrastructureBundle;
  private eventBus!: EventBusPort;

  static fromInfrastructure(infra: InfrastructureBundle, eventBus: EventBusPort): ServiceRegistryBuilder {
    const builder = new ServiceRegistryBuilder();
    builder.infra = infra;
    builder.eventBus = eventBus;
    return builder;
  }

  build(): ServiceRegistry {
    const { repositories: repos, auth, documentPipeline, ragEngine } = this.infra;

    return {
      auth: new AuthServiceFacade(repos, auth, this.eventBus),
      workspace: new WorkspaceServiceFacade(repos, this.eventBus),
      document: new DocumentServiceFacade(repos, documentPipeline, this.eventBus),
      conversation: new ConversationServiceFacade(repos, ragEngine, this.infra.ai, this.eventBus),
      analytics: new AnalyticsServiceFacade(repos),
      apiKey: new ApiKeyServiceFacade(repos, auth),
      integration: new IntegrationServiceFacade(repos),
      activity: new ActivityServiceFacade(repos),
    };
  }
}
