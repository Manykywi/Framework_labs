import authController from '#controllers/auth.controller';
import { registerBodySchema, loginBodySchema } from '#schemas/auth.schema';

const userResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    email: { type: 'string' },
  },
  additionalProperties: false,
};

const tokenResponseSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
  },
  additionalProperties: false,
};

async function authRoutes(fastify) {
  fastify.post('/auth/register', {
    schema: {
      tags: ['auth'],
      summary: 'Register a new user',
      body: registerBodySchema,
      response: { 201: userResponseSchema },
    },
  }, authController.register);

  fastify.post('/auth/login', {
    schema: {
      tags: ['auth'],
      summary: 'Login — returns access token in body, refresh token in httpOnly cookie',
      body: loginBodySchema,
      response: { 200: tokenResponseSchema },
    },
  }, authController.login);

  fastify.post('/auth/refresh', {
    schema: {
      tags: ['auth'],
      summary: 'Exchange refresh token cookie for a new access token',
      response: { 200: tokenResponseSchema },
    },
  }, authController.refresh);

  fastify.post('/auth/logout', {
    onRequest: [fastify.verifyJwt],
    schema: {
      tags: ['auth'],
      summary: 'Logout — blacklists access token, deletes refresh token from Redis',
      security: [{ bearerAuth: [] }],
      response: { 204: { type: 'null' } },
    },
  }, authController.logout);
}

export default authRoutes;
