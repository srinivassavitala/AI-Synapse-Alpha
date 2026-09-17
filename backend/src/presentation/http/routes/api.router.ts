import { Router } from 'express';
import type { ServiceRegistry } from '../../../core/registry/service-registry-builder.js';
import type { AuthTokenPort } from '../../../domain/ports/infrastructure.port.js';
import { createAuthMiddleware, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { successResponse, paginatedResponse } from '../../../shared/types/api-response.js';
import multer from 'multer';
import { routeParamFrom } from '../middleware/route-param.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export function buildApiRouter(registry: ServiceRegistry, auth: AuthTokenPort): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(auth);

  router.get('/health', (_req, res) => {
    res.json(successResponse({ status: 'ok', service: 'SynapseIQ API', version: '1.0.0' }));
  });

  router.post('/auth/register', async (req, res, next) => {
    try {
      const { email, password, fullName } = req.body;
      const result = await registry.auth.register(email, password, fullName);
      res.status(201).json(successResponse(result));
    } catch (e) { next(e); }
  });

  router.post('/auth/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await registry.auth.login(email, password);
      res.json(successResponse(result));
    } catch (e) { next(e); }
  });

  router.get('/auth/me', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const profile = await registry.auth.getProfile(userId);
      res.json(successResponse(profile));
    } catch (e) { next(e); }
  });

  router.patch('/auth/me', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const profile = await registry.auth.updateProfile(userId, req.body);
      res.json(successResponse(profile));
    } catch (e) { next(e); }
  });

  router.get('/workspaces', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const workspaces = await registry.workspace.listForUser(userId);
      res.json(successResponse(workspaces));
    } catch (e) { next(e); }
  });

  router.post('/workspaces', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const workspace = await registry.workspace.create(userId, req.body.name);
      res.status(201).json(successResponse(workspace));
    } catch (e) { next(e); }
  });

  router.get('/workspaces/:workspaceId', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const workspace = await registry.workspace.getById(routeParamFrom(req, 'workspaceId'), userId);
      res.json(successResponse(workspace));
    } catch (e) { next(e); }
  });

  router.post('/workspaces/:workspaceId/members', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const member = await registry.workspace.inviteMember(routeParamFrom(req, 'workspaceId'), userId, req.body.email, req.body.role);
      res.status(201).json(successResponse(member));
    } catch (e) { next(e); }
  });

  router.get('/workspaces/:workspaceId/documents', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, total } = await registry.document.list(routeParamFrom(req, 'workspaceId'), userId, page, limit);
      res.json(paginatedResponse(items, total, page, limit));
    } catch (e) { next(e); }
  });

  router.get('/workspaces/:workspaceId/documents/search', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const results = await registry.document.search(routeParamFrom(req, 'workspaceId'), userId, req.query.q as string);
      res.json(successResponse(results));
    } catch (e) { next(e); }
  });

  router.post('/workspaces/:workspaceId/documents/upload', requireAuth, upload.single('file'), async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!req.file) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } }); return; }
      const doc = await registry.document.upload(routeParamFrom(req, 'workspaceId'), userId, {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
      });
      res.status(201).json(successResponse(doc));
    } catch (e) { next(e); }
  });

  router.get('/documents/:documentId', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const doc = await registry.document.getById(routeParamFrom(req, 'documentId'), userId);
      res.json(successResponse(doc));
    } catch (e) { next(e); }
  });

  router.delete('/documents/:documentId', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      await registry.document.delete(routeParamFrom(req, 'documentId'), userId);
      res.json(successResponse({ deleted: true }));
    } catch (e) { next(e); }
  });

  router.get('/workspaces/:workspaceId/conversations', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const conversations = await registry.conversation.list(routeParamFrom(req, 'workspaceId'), userId);
      res.json(successResponse(conversations));
    } catch (e) { next(e); }
  });

  router.post('/workspaces/:workspaceId/conversations', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const conv = await registry.conversation.create(routeParamFrom(req, 'workspaceId'), userId, req.body.title || 'New Conversation');
      res.status(201).json(successResponse(conv));
    } catch (e) { next(e); }
  });

  router.get('/conversations/:conversationId/messages', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const messages = await registry.conversation.getMessages(routeParamFrom(req, 'conversationId'), userId);
      res.json(successResponse(messages));
    } catch (e) { next(e); }
  });

  router.post('/conversations/:conversationId/messages', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const message = await registry.conversation.sendMessage(routeParamFrom(req, 'conversationId'), userId, req.body.content);
      res.json(successResponse(message));
    } catch (e) { next(e); }
  });

  router.delete('/conversations/:conversationId', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      await registry.conversation.delete(routeParamFrom(req, 'conversationId'), userId);
      res.json(successResponse({ deleted: true }));
    } catch (e) { next(e); }
  });

  router.get('/workspaces/:workspaceId/analytics', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const analytics = await registry.analytics.getDashboard(routeParamFrom(req, 'workspaceId'), userId);
      res.json(successResponse(analytics));
    } catch (e) { next(e); }
  });

  router.get('/workspaces/:workspaceId/activity', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const page = parseInt(req.query.page as string) || 1;
      const { items, total } = await registry.activity.list(routeParamFrom(req, 'workspaceId'), userId, page);
      res.json(paginatedResponse(items, total, page, 30));
    } catch (e) { next(e); }
  });

  router.get('/workspaces/:workspaceId/api-keys', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const keys = await registry.apiKey.list(routeParamFrom(req, 'workspaceId'), userId);
      res.json(successResponse(keys));
    } catch (e) { next(e); }
  });

  router.post('/workspaces/:workspaceId/api-keys', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const key = await registry.apiKey.create(routeParamFrom(req, 'workspaceId'), userId, req.body.name);
      res.status(201).json(successResponse(key));
    } catch (e) { next(e); }
  });

  router.delete('/api-keys/:keyId', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      await registry.apiKey.revoke(routeParamFrom(req, 'keyId'), userId);
      res.json(successResponse({ revoked: true }));
    } catch (e) { next(e); }
  });

  router.get('/workspaces/:workspaceId/integrations', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const integrations = await registry.integration.list(routeParamFrom(req, 'workspaceId'), userId);
      res.json(successResponse(integrations));
    } catch (e) { next(e); }
  });

  router.post('/workspaces/:workspaceId/integrations/:provider/connect', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const result = await registry.integration.connect(routeParamFrom(req, 'workspaceId'), userId, routeParamFrom(req, 'provider') as 'slack' | 'notion' | 'google_drive' | 'github');
      res.json(successResponse(result));
    } catch (e) { next(e); }
  });

  router.post('/workspaces/:workspaceId/integrations/:provider/disconnect', requireAuth, async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      await registry.integration.disconnect(routeParamFrom(req, 'workspaceId'), userId, routeParamFrom(req, 'provider') as 'slack' | 'notion' | 'google_drive' | 'github');
      res.json(successResponse({ disconnected: true }));
    } catch (e) { next(e); }
  });

  return router;
}
