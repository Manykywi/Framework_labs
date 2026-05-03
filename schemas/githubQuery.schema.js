const githubQuerySchema = {
  type: 'object',
  properties: {
    repo: { type: 'string', description: 'Repository path, e.g. fastify/fastify' },
  },
  required: ['repo'],
  additionalProperties: false,
};

export default githubQuerySchema;
