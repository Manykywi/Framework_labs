import { buildApp } from './app.js';
import { runBackup } from './src/utils/backup.js';

let isShuttingDown = false;

const fastify = await buildApp();

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
  const address = await fastify.listen({ port: fastify.config.PORT, host: fastify.config.HOSTNAME });
  fastify.log.info(`Server running at ${address}`);
} catch (error) {
  fastify.log.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
}
