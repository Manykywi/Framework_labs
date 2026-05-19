import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import cookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import path from 'path';
import registerEnv from './config/env.js';
import studentRoutes from './routes/student.routes.js';
import studentRoutesV2 from './routes/student.routes.v2.js';
import { createGithubRoutes } from './routes/github.routes.js';
import wsRoutes from './routes/ws.routes.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import ERROR_MESSAGES from '#constants/errorMessages';
import mysqlPlugin from './db/mysql.js';
import drizzlePlugin from './db/drizzle.js';
import redisPlugin from './db/redis.js';
import { StudentRepository } from './src/repositories/student.repository.js';
import { StudentService } from './services/student.service.js';
import { UserRepository } from './src/repositories/user.repository.js';
import { createExternalService } from './src/services/external.service.js';
import { createAuthService } from './src/services/auth.service.js';
import { REDIS_KEYS } from './constants/redisKeys.js';

export async function buildApp() {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  const logger =
    nodeEnv === 'test'
      ? false
      : nodeEnv === 'production'
        ? { level: 'error' }
        : {
            level: 'info',
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:standard', singleLine: true },
            },
          };

  const fastify = Fastify({
    ignoreTrailingSlash: true,
    disableRequestLogging: true,
    logger,
    ajv: { customOptions: { coerceTypes: true } },
  });

  await registerEnv(fastify);
  await fastify.register(sensible);

  const isProduction = fastify.config.NODE_ENV === 'production';

  if (isProduction && fastify.config.CORS_ORIGIN === '*') {
    throw new Error("CORS_ORIGIN cannot be '*' in production.");
  }

  await fastify.register(cors, {
    origin: isProduction ? fastify.config.CORS_ORIGIN : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await fastify.register(helmet, { global: true, contentSecurityPolicy: false });
  await fastify.register(redisPlugin);

  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis: fastify.redis,
  });

  await fastify.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  await fastify.register(staticPlugin, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Students API',
        description: 'Lab 9 JWT — Redis caching, rate limiting, JWT authentication',
        version: '3.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      tags: [
        { name: 'auth', description: 'JWT authentication — Authorization: Bearer <token>' },
        { name: 'students', description: 'v1 student endpoints' },
        { name: 'students-v2', description: 'v2 student endpoints (pagination)' },
        { name: 'github-v1', description: 'GitHub analytics v1 (sequential)' },
        { name: 'github-v2', description: 'GitHub analytics v2 (parallel)' },
        { name: 'health', description: 'Health check endpoints' },
        { name: 'backups', description: 'Backup management (protected)' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  await fastify.register(websocket);
  await fastify.register(mysqlPlugin);
  await fastify.register(drizzlePlugin);
  await fastify.register(cookie);

  await fastify.register(fastifyJwt, {
    secret: fastify.config.JWT_SECRET,
    trusted: async (_request, decodedToken) => {
      if (!decodedToken.jti) return true;
      const isBlacklisted = await fastify.redis.get(REDIS_KEYS.blacklist(decodedToken.jti));
      return isBlacklisted === null;
    },
  });

  fastify.decorate('verifyJwt', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.decorate('studentRepo', new StudentRepository(fastify.drizzle));
  fastify.decorate('studentService', new StudentService(fastify.studentRepo, fastify.redis));
  fastify.decorate('externalService', createExternalService({ redis: fastify.redis }));
  fastify.decorate('userRepo', new UserRepository(fastify.drizzle));
  fastify.decorate('authService', createAuthService({ userRepo: fastify.userRepo }));

  fastify.addHook('onResponse', (request, reply, done) => {
    if (!isProduction) {
      request.log.info({ method: request.method, url: request.url, statusCode: reply.statusCode }, 'request');
      done();
      return;
    }
    if (reply.statusCode >= 400) {
      request.log.error({ method: request.method, url: request.url, statusCode: reply.statusCode }, 'request');
    }
    done();
  });

  fastify.addHook('onClose', (instance, done) => {
    instance.log.info('Fastify server is closing.');
    done();
  });

  fastify.setNotFoundHandler((request, reply) => {
    reply.notFound(ERROR_MESSAGES.ROUTE_NOT_FOUND);
  });

  fastify.setErrorHandler((error, request, reply) => {
    if (reply.sent) return;
    const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
    const logContext = { requestId: request.id, method: request.method, url: request.url };

    if (statusCode >= 500) {
      fastify.log.error({ err: error, ...logContext }, 'Unhandled request error');
      reply.internalServerError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
      return;
    }

    fastify.log.warn({ err: error, ...logContext }, 'Request error');

    if (error?.code === 'FST_ERR_CTP_INVALID_JSON_BODY') {
      reply.badRequest(ERROR_MESSAGES.INVALID_JSON);
      return;
    }
    if (Array.isArray(error?.validation) && error.validation.length) {
      reply.badRequest(ERROR_MESSAGES.VALIDATION_ERROR);
      return;
    }

    reply.code(statusCode).send({ error: error.message });
  });

  await fastify.register(healthRoutes);
  await fastify.register(wsRoutes);
  await fastify.register(authRoutes);
  await fastify.register(studentRoutes, { prefix: '/api/v1' });
  await fastify.register(studentRoutesV2, { prefix: '/api/v2' });
  await fastify.register(createGithubRoutes('v1'), { prefix: '/api/v1' });
  await fastify.register(createGithubRoutes('v2'), { prefix: '/api/v2' });

  return fastify;
}
