import githubController from '#controllers/github.controller';
import githubQuerySchema from '#schemas/githubQuery.schema';

const sharedReposResponseSchema = {
  type: 'object',
  properties: {
    repo: { type: 'string' },
    sharedRepos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          full_name: { type: 'string' },
          sharedContributors: { type: 'integer' },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

export function createGithubRoutes(version) {
  const handler = version === 'v1' ? githubController.sharedReposV1 : githubController.sharedReposV2;

  return async function githubRoutes(fastify) {
    fastify.get('/github/shared-repos', {
      schema: {
        tags: [`github-${version}`],
        summary: `Find repos with most shared contributors (${version === 'v1' ? 'sequential REST' : 'parallel REST'})`,
        querystring: githubQuerySchema,
        response: { 200: sharedReposResponseSchema },
      },
    }, handler);
  };
}
