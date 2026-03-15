import { createServer } from 'node:http';
import config from './config.js';
import handleStudentRoutes from './routes/student.routes.js';
import handleHealthRoutes from './routes/health.routes.js';
import { logError, logInfo, logRequest, logWarn } from '#utils/logger';

let isShuttingDown = false;

const server = createServer((req, res) => {
  res.on('finish', () => {
    const statusCode = res.statusCode;

    if (config.isDevelopment) {
      logRequest(req, statusCode, 'INFO');
      return;
    }

    if (config.isProduction && statusCode >= 400) {
      logRequest(req, statusCode, 'ERROR');
    }
  });

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (handleHealthRoutes(req, res, pathname, parsedUrl)) {
    return;
  }

  if (handleStudentRoutes(req, res, pathname, parsedUrl)) {
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Route not found' }));
});

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logWarn(`Received ${signal}. Starting graceful shutdown...`);

  const exitCode = signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1;

  server.close((error) => {
    if (error) {
      logError(`Failed to close HTTP server: ${error.message}`);
      process.exit(1);
    }

    logInfo('HTTP server closed. Exiting.');
    process.exit(exitCode);
  });

  setTimeout(() => {
    logError('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10_000).unref();
}

server.listen(config.PORT, config.HOSTNAME, () => {
  logInfo(`Server running at http://${config.HOSTNAME}:${config.PORT}/`);
});

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
  logError(error instanceof Error ? error.stack || error.message : String(error));
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  logError(reason instanceof Error ? reason.stack || reason.message : String(reason));
  gracefulShutdown('unhandledRejection');
});
