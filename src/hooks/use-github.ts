import { useEffect, useState } from "react"

export type GithubRepo = {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  fork: boolean
  archived: boolean
  /** ISO date, null when missing or unparsable */
  pushed_at: string | null
}

export type GithubOrg = {
  login: string
  /** numeric account id, used to build the avatar URL */
  id: number
  description: string | null
}

export type GithubData = {
  publicRepos: number
  followers: number | null
  repos: GithubRepo[]
  orgs: GithubOrg[]
}

// The unauthenticated API allows 60 requests/hour per IP, so cache per tab session.
const TTL = 10 * 60 * 1000
// Bump when GithubData changes shape, so entries cached by an older build are ignored.
const CACHE_VERSION = 2

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v : null)

function normalizeRepo(raw: unknown): GithubRepo | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const name = text(r.name)
  if (!name) return null
  const pushed = text(r.pushed_at)
  return {
    name,
    description: text(r.description),
    language: text(r.language),
    stargazers_count:
      Number.isSafeInteger(r.stargazers_count) && (r.stargazers_count as number) >= 0 ? (r.stargazers_count as number) : 0,
    fork: r.fork === true,
    archived: r.archived === true,
    pushed_at: pushed && Number.isFinite(Date.parse(pushed)) ? pushed : null,
  }
}

function normalizeOrg(raw: unknown): GithubOrg | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const login = text(o.login)
  if (!login || !Number.isSafeInteger(o.id) || (o.id as number) <= 0) return null
  return { login, id: o.id as number, description: text(o.description) }
}

/**
 * GitHub's responses (or a cached copy of them) come from outside, so shape them once
 * here: the components can then trust the types instead of guarding each field.
 */
function normalize(user: unknown, repos: unknown, orgs: unknown): GithubData {
  if (!Array.isArray(repos) || !Array.isArray(orgs)) throw new Error("github: unexpected response")
  const u = (user && typeof user === "object" ? user : {}) as Record<string, unknown>
  const cleanRepos = repos.map(normalizeRepo).filter((r): r is GithubRepo => r !== null)
  return {
    publicRepos: typeof u.public_repos === "number" ? u.public_repos : cleanRepos.length,
    followers: typeof u.followers === "number" ? u.followers : null,
    repos: cleanRepos,
    orgs: orgs.map(normalizeOrg).filter((o): o is GithubOrg => o !== null),
  }
}

function readCache(key: string): GithubData | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { at, data } = JSON.parse(raw)
    if (typeof at !== "number" || Date.now() - at >= TTL) return null
    // re-normalized, so an old or corrupted entry can't reach the components
    return normalize({ public_repos: data.publicRepos, followers: data.followers }, data.repos, data.orgs)
  } catch {
    return null
  }
}

function writeCache(key: string, data: GithubData) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }))
  } catch {
    // storage full or blocked — just refetch next time
  }
}

function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  return fetch(url, { signal }).then((r) => {
    if (!r.ok) throw new Error(`github ${r.status}`)
    return r.json()
  })
}

export function useGithub(user: string) {
  const key = `gh:v${CACHE_VERSION}:${user}`
  const [data, setData] = useState<GithubData | null>(() => readCache(key))
  const [error, setError] = useState(false)

  useEffect(() => {
    if (data) return
    const ctrl = new AbortController()
    const api = `https://api.github.com/users/${encodeURIComponent(user)}`

    Promise.all([
      getJson(api, ctrl.signal),
      getJson(`${api}/repos?per_page=100&sort=pushed`, ctrl.signal),
      getJson(`${api}/orgs?per_page=100`, ctrl.signal),
    ])
      .then(([u, repos, orgs]) => {
        const next = normalize(u, repos, orgs)
        writeCache(key, next)
        setData(next)
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setError(true)
      })

    return () => ctrl.abort()
  }, [data, key, user])

  return { data, error, loading: !data && !error }
}

// Both sorts are stable, so equal entries keep the API's order (last push first). They sort
// a copy instead of using toSorted(), which some browsers Vite still targets don't have.

/** The Projects page order: my own repos, then forks, then archived. */
export function sortRepos(repos: GithubRepo[]): GithubRepo[] {
  const rank = (r: GithubRepo) => (r.archived ? 2 : r.fork ? 1 : 0)
  return [...repos].sort((a, b) => rank(a) - rank(b))
}

/** For the home page: my own active repos, most stars first. */
export function featuredRepos(repos: GithubRepo[], count: number): GithubRepo[] {
  return repos
    .filter((r) => !r.fork && !r.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, count)
}

/** Built from the numeric id, so a bad response can't make the page load an arbitrary image URL. */
export function orgAvatarUrl(org: GithubOrg, size = 80) {
  return `https://avatars.githubusercontent.com/u/${org.id}?v=4&s=${size}`
}
