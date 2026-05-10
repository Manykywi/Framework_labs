import githubService from '../src/services/github.service.js';
import HTTP from '#constants/httpStatus';

async function sharedReposV1(request, reply) {
  const { repo } = request.query;
  const sharedRepos = await githubService.getSharedReposV1(repo);
  return reply.code(HTTP.OK).send({ repo, sharedRepos });
}

async function sharedReposV2(request, reply) {
  const { repo } = request.query;
  const sharedRepos = await githubService.getSharedReposV2(repo);
  return reply.code(HTTP.OK).send({ repo, sharedRepos });
}

export default { sharedReposV1, sharedReposV2 };
