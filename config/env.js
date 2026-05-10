import fastifyEnv from '@fastify/env';
import envSchema from '#schemas/env.schema';

export default async function registerEnv(fastify) {
  await fastify.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
    confKey: 'config',
  });
}
