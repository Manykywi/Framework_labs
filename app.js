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
import fs from 'node:fs';
import path from 'path';
import registerEnv from './config/env.js';
import studentRoutes from './routes/student.routes.js';
import studentRoutesV2 from './routes/student.routes.v2.js';
import { createGithubRoutes } from './routes/github.routes.js';
import wsRoutes from './routes/ws.routes.js';
import healthRoutes from './routes/health.routes.js';
import ERROR_MESSAGES from '#constants/errorMessages';
import { runBackup } from './src/utils/backup.js';
import mysqlPlugin from './db/mysql.js';
import drizzlePlugin from './db/drizzle.js';
import { StudentRepository } from './src/repositories/student.repository.js';
import { StudentService } from './services/student.service.js';

let isShuttingDown = false;

function readNodeEnvFromDotenv() {
  try {
    const content = fs.readFileSync('.env', 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      if (key !== 'NODE_ENV') continue;
      let value = trimmed.slice(eqIndex + 1).trim();
      value = value.replace(/^['"]|['"]$/g, '');
      if (value === 'production' || value === 'development') return value;
      return undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

const nodeEnv = readNodeEnvFromDotenv() ?? 'development';

const logger =
  nodeEnv === 'production'
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

try {
  await registerEnv(fastify);
} catch (error) {
  fastify.log.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
}

await fastify.register(sensible);

const runtimeConfig = {
  ...fastify.config,
  isDevelopment: fastify.config.NODE_ENV === 'development',
  isProduction: fastify.config.NODE_ENV === 'production',
};

if (runtimeConfig.isProduction && runtimeConfig.CORS_ORIGIN === '*') {
  fastify.log.error("CORS_ORIGIN cannot be '*' in production.");
  process.exit(1);
}

await fastify.register(cors, {
  origin: runtimeConfig.isProduction ? runtimeConfig.CORS_ORIGIN : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
});

await fastify.register(helmet, {
  global: true,
  contentSecurityPolicy: false,
});

await fastify.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
});

await fastify.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 },
});

await fastify.register(staticPlugin, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
});

await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'Students API',
      description: 'Lab 8 — REST API with MySQL via Drizzle ORM',
      version: '2.0.0',
    },
    tags: [
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

fastify.decorate('studentRepo', new StudentRepository(fastify.drizzle));
fastify.decorate('studentService', new StudentService(fastify.studentRepo));

fastify.addHook('onResponse', (request, reply, done) => {
  const statusCode = reply.statusCode;
  if (!runtimeConfig.isProduction) {
    request.log.info({ method: request.method, url: request.url, statusCode }, 'request');
    done();
    return;
  }
  if (statusCode >= 400) {
    request.log.error({ method: request.method, url: request.url, statusCode }, 'request');
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
await fastify.register(studentRoutes, { prefix: '/api/v1' });
await fastify.register(studentRoutesV2, { prefix: '/api/v2' });
await fastify.register(createGithubRoutes('v1'), { prefix: '/api/v1' });
await fastify.register(createGithubRoutes('v2'), { prefix: '/api/v2' });

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  fastify.log.warn(`Received ${signal}. Starting graceful shutdown...`);
  const exitCode = signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1;
  const shutdownTimer = setTimeout(() => {
    fastify.log.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10_000).unref();
  try {
    await fastify.close();
    fastify.log.info('Fastify server closed. Exiting.');
    process.exit(exitCode);
  } catch (error) {
    fastify.log.error(
      `Failed to close Fastify server: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  } finally {
    clearTimeout(shutdownTimer);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
  fastify.log.error(error instanceof Error ? error.stack || error.message : String(error));
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  fastify.log.error(reason instanceof Error ? reason.stack || reason.message : String(reason));
  gracefulShutdown('unhandledRejection');
});

try {
  await runBackup(fastify.studentRepo);
  const address = await fastify.listen({ port: runtimeConfig.PORT, host: runtimeConfig.HOSTNAME });
  fastify.log.info(`Server running at ${address}`);
} catch (error) {
  fastify.log.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
}
