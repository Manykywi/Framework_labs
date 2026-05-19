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
      summary: 'Login and create session',
      body: loginBodySchema,
      response: { 200: userResponseSchema },
    },
  }, authController.login);

  fastify.post('/auth/logout', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Logout and destroy session',
      response: { 204: { type: 'null' } },
    },
  }, authController.logout);
}

export default authRoutes;
