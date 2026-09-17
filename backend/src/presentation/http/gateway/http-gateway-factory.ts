import express from 'express';
import cors from 'cors';
import type { ServiceRegistry } from '../../../core/registry/service-registry-builder.js';
import type { AuthTokenPort } from '../../../domain/ports/infrastructure.port.js';
import { envConfig } from '../../../config/environment/env-config.js';
import { buildApiRouter } from '../routes/api.router.js';
import { globalErrorHandler, requestLogger } from '../middleware/error.middleware.js';
import { attachRegistry } from '../middleware/auth.middleware.js';

export class HttpGatewayFactory {
  static create(registry: ServiceRegistry, auth: AuthTokenPort): express.Application {
    const app = express();

    app.use(cors({ origin: envConfig.CORS_ORIGIN, credentials: true }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(requestLogger);
    app.use(attachRegistry(registry));
    app.use('/api/v1', buildApiRouter(registry, auth));
    app.use(globalErrorHandler);

    return app;
  }
}
