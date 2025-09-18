import { headers } from 'next/headers';

const API = 'https://api.github.com';

type RW = 'read' | 'write';

function reqHeaders(mode: RW, sha?: string) {
  const h: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (mode === 'write') h['Content-Type'] = 'application/json';
  if (sha) h['If-Match'] = sha; // optimistic concurrency using ETag-like check (not required here)
  return h;
}

async function getFile(owner: string, repo: string, path: string, ref: string) {
  const url = `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`;
  const res = await fetch(url, { headers: reqHeaders('read'), cache: 'no-store' });
  if (res.status === 404) return { exists: false };
  if (!res.ok) throw new Error(`GitHub read error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const content = Buffer.from(data.content || '', 'base64').toString('utf-8');
  return { exists: true, sha: data.sha, content };
}

async function putFile(owner: string, repo: string, path: string, ref: string, content: string, message: string, sha?: string) {
  const url = `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body = {
    message,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    branch: ref,
    sha,
  };
  const res = await fetch(url, { method: 'PUT', headers: reqHeaders('write'), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`GitHub write error: ${res.status} ${await res.text()}`);
  return await res.json();
}

export async function readJSON<T>(path: string): Promise<{json: T|null, sha?: string}> {
  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;
  const branch = process.env.GITHUB_BRANCH!;
  const f = await getFile(owner, repo, path, branch);
  if (!f.exists) return { json: null };
  const j = JSON.parse(f.content || 'null');
  return { json: j as T, sha: f.sha };
}

export async function writeJSON<T>(path: string, json: T, message: string, sha?: string) {
  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;
  const branch = process.env.GITHUB_BRANCH!;
  return await putFile(owner, repo, path, branch, JSON.stringify(json, null, 2), message, sha);
}
