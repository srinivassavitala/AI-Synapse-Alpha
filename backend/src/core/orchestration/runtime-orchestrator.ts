import type { ApplicationKernel } from '../kernel/application-kernel.js';
import { ServiceRegistryBuilder } from '../registry/service-registry-builder.js';
import { InfrastructureComposer } from '../../infrastructure/composition/infrastructure-composer.js';
import { HttpGatewayFactory } from '../../presentation/http/gateway/http-gateway-factory.js';
import { DomainEventDispatcher } from '../../infrastructure/messaging/domain-event-dispatcher.js';
import { envConfig } from '../../config/environment/env-config.js';
import { EventHandlerRegistry } from '../../application/events/event-handler.registry.js';

export class RuntimeOrchestrator {
  constructor(private readonly kernel: ApplicationKernel) {}

  async ignite(): Promise<void> {
    const eventBus = new DomainEventDispatcher();
    const infrastructure = InfrastructureComposer.compose(eventBus);
    const registry = ServiceRegistryBuilder.fromInfrastructure(infrastructure, eventBus).build();

    EventHandlerRegistry.register(infrastructure.repositories, eventBus);

    const httpServer = HttpGatewayFactory.create(registry, infrastructure.auth);

    this.kernel.attachContext({ registry, eventBus, httpServer });

    const port = envConfig.PORT;
    httpServer.listen(port, () => {
      console.log(`[SynapseIQ] Backend running on http://localhost:${port}`);
      console.log(`[SynapseIQ] Environment: ${envConfig.NODE_ENV}`);
    });
  }
}
