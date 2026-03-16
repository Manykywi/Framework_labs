import healthController from '#controllers/health.controller';
import healthResponseSchema from '#schemas/healthResponse.schema';
import healthPublicResponseSchema from '#schemas/healthPublicResponse.schema';
import ERROR_MESSAGES from '#constants/errorMessages';

async function healthRoutes(fastify) {
  const publicOptions = {
    schema: {
      response: {
        200: healthPublicResponseSchema,
      },
    },
  };

  const detailsOptions = {
    onRequest: (request, reply, done) => {
      const header = request.headers['x-api-key'];
      const apiKey = Array.isArray(header) ? header[0] : header;

      if (!apiKey || apiKey !== fastify.config.ADMIN_API_KEY) {
        reply.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
        return;
      }

      done();
    },
    schema: {
      response: {
        200: healthResponseSchema,
      },
    },
  };

  fastify.get('/health', publicOptions, healthController.getHealth);
  fastify.get('/health/details', detailsOptions, healthController.getHealthDetails);
}

export default healthRoutes;
