import type { Application } from 'express';
import type { ServiceRegistry } from '../registry/service-registry-builder.js';
import type { EventBusPort } from '../../domain/ports/event-bus.port.js';

export interface ApplicationContext {
  readonly registry: ServiceRegistry;
  readonly eventBus: EventBusPort;
  readonly httpServer: Application;
}

export class ApplicationKernel {
  private static instance: ApplicationKernel | null = null;
  private context: ApplicationContext | null = null;

  private constructor() {}

  static initialize(): ApplicationKernel {
    if (!ApplicationKernel.instance) {
      ApplicationKernel.instance = new ApplicationKernel();
    }
    return ApplicationKernel.instance;
  }

  attachContext(context: ApplicationContext): void {
    this.context = context;
  }

  getContext(): ApplicationContext {
    if (!this.context) {
      throw new Error('Application context not initialized');
    }
    return this.context;
  }
}
