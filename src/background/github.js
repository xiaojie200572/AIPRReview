const GITHUB_API = 'https://api.github.com'

async function getToken() {
  const { githubToken } = await chrome.storage.local.get('githubToken')
  return githubToken || ''
}

async function ghFetch(path, options = {}) {
  const token = await getToken()
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${GITHUB_API}${path}`, { ...options, headers })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    if (res.status === 403 || res.status === 429) {
      throw new Error(token
        ? `GitHub API 请求超限（${res.status}），请稍后重试`
        : `GitHub API 频率限制（${res.status}），请在设置中配置 GitHub Token 以解除限制（5000次/小时）`)
    }
    throw new Error(`GitHub API ${res.status}: ${msg || res.statusText}`)
  }
  return res.json()
}

export function parsePRUrl(url) {
  const m = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (!m) throw new Error(`Invalid GitHub PR URL: ${url}`)
  return { owner: m[1], repo: m[2], prNumber: Number(m[3]) }
}

export async function getPRInfo(owner, repo, prNumber) {
  const data = await ghFetch(`/repos/${owner}/${repo}/pulls/${prNumber}`)
  return {
    title: data.title,
    body: data.body || '',
    author: data.user?.login || '',
    state: data.state,
    base: data.base?.ref || '',
    head: data.head?.ref || '',
    headSha: data.head?.sha || '',
    createdAt: data.created_at,
    html_url: data.html_url,
  }
}

export async function getPRFiles(owner, repo, prNumber) {
  const files = []
  let page = 1
  while (true) {
    const data = await ghFetch(`/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100&page=${page}`)
    files.push(...data)
    if (data.length < 100) break
    page++
  }
  return files.map(f => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    patch: f.patch || '',
  }))
}

export async function getPRCommits(owner, repo, prNumber) {
  const data = await ghFetch(`/repos/${owner}/${repo}/pulls/${prNumber}/commits`)
  return data.map(c => ({
    sha: c.sha,
    message: c.commit?.message || '',
    author: c.commit?.author?.name || '',
  }))
}

export async function getFileContent(owner, repo, path, ref) {
  const data = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`)
  if (data.content) {
    return atob(data.content.replace(/\n/g, ''))
  }
  throw new Error(`File not found: ${path}`)
}
