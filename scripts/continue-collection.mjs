import path from 'node:path';
import {fileURLToPath} from 'node:url';

const INTERVAL = 5 * 60_000;
export const SOURCE_SETTLE_MS = 12_000;

// Keep the timer in the running job. GitHub's cron is only a recovery path.
export function nextCollectionTime(now = Date.now()) {
  const candidate = Math.floor(now / INTERVAL) * INTERVAL + SOURCE_SETTLE_MS;
  return candidate > now ? candidate : candidate + INTERVAL;
}

export async function continueCollection({
  token,
  repository,
  workflow = 'collect-and-deploy.yml',
  ref = 'main',
  fetcher = globalThis.fetch,
  now = Date.now,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  log = console.log,
} = {}) {
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repository || '') ||
      !/^[\w.-]+\.ya?ml$/.test(workflow) || ref !== 'main') {
    throw Error('Automatic continuation configuration is missing or invalid.');
  }
  const target = nextCollectionTime(now());
  log('Next automatic collection target: ' + new Date(target).toISOString());
  while (now() < target) await sleep(Math.min(30_000, target - now()));

  const url = 'https://api.github.com/repos/' + repository +
    '/actions/workflows/' + workflow + '/dispatches';
  for (let attempt = 0; attempt < 4; attempt++) {
    let status = 0;
    try {
      const response = await fetcher(url, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'chart-room-auto-collector',
        },
        body: JSON.stringify({ref}),
        signal: AbortSignal.timeout(15_000),
      });
      status = response.status;
      if (status === 204) {
        log('Next collection queued automatically.');
        return {target, queued: true};
      }
    } catch {
      // Never echo a request, token, or an exception supplied by an HTTP client.
    }
    if (status >= 400 && status < 500 && status !== 429) {
      throw Error('Automatic continuation refused: HTTP ' + status +
        '. Check Actions write permission and whether the workflow is enabled.');
    }
    if (attempt < 3) await sleep(2_000 * (attempt + 1));
  }
  throw Error('Automatic continuation is unavailable. The recovery schedule remains enabled.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await continueCollection({
      token: process.env.GH_TOKEN,
      repository: process.env.GITHUB_REPOSITORY,
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
