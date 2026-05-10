import { fetchWithRetry } from './fetchUtils.js';

const BASE = 'https://api.github.com';
const MAX_CONTRIBUTORS = 10;

function githubHeaders() {
  const headers = {
    'User-Agent': 'lab6-app',
    Accept: 'application/vnd.github+json',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchContributors(owner, repo) {
  const response = await fetchWithRetry(
    `${BASE}/repos/${owner}/${repo}/contributors?per_page=100`,
    { headers: githubHeaders() }
  );
  return response.json();
}

async function fetchUserRepos(username) {
  const response = await fetchWithRetry(
    `${BASE}/users/${username}/repos?per_page=100`,
    { headers: githubHeaders() }
  );
  return response.json();
}

function countShared(reposPerContributor, repoPath) {
  const counts = {};
  for (const repos of reposPerContributor) {
    if (!Array.isArray(repos)) continue;
    for (const r of repos) {
      if (r.full_name.toLowerCase() === repoPath.toLowerCase()) continue;
      counts[r.full_name] = (counts[r.full_name] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([full_name, sharedContributors]) => ({ full_name, sharedContributors }));
}

async function getSharedReposV1(repoPath) {
  const [owner, repo] = repoPath.split('/');
  const contributors = await fetchContributors(owner, repo);
  const reposPerContributor = [];
  for (const contributor of contributors.slice(0, MAX_CONTRIBUTORS)) {
    try {
      const repos = await fetchUserRepos(contributor.login);
      reposPerContributor.push(repos);
    } catch {
      reposPerContributor.push([]);
    }
  }
  return countShared(reposPerContributor, repoPath);
}

async function getSharedReposV2(repoPath) {
  const [owner, repo] = repoPath.split('/');
  const contributors = await fetchContributors(owner, repo);
  const results = await Promise.allSettled(
    contributors.slice(0, MAX_CONTRIBUTORS).map((c) => fetchUserRepos(c.login))
  );
  const reposPerContributor = results.map((r) => (r.status === 'fulfilled' ? r.value : []));
  return countShared(reposPerContributor, repoPath);
}

export default { getSharedReposV1, getSharedReposV2 };
