import { useEffect, useState } from "react"

export type GithubRepo = {
  name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  fork: boolean
  archived: boolean
  pushed_at: string
}

export type GithubData = {
  publicRepos: number
  followers: number
  repos: GithubRepo[]
}

// The unauthenticated API allows 60 requests/hour per IP, so cache per tab session.
const TTL = 10 * 60 * 1000

function readCache(key: string): GithubData | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { at, data } = JSON.parse(raw)
    return Date.now() - at < TTL ? data : null
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

export function useGithub(user: string) {
  const key = `gh:${user}`
  const [data, setData] = useState<GithubData | null>(() => readCache(key))
  const [error, setError] = useState(false)

  useEffect(() => {
    if (data) return
    const ctrl = new AbortController()
    const api = `https://api.github.com/users/${user}`

    Promise.all([
      fetch(api, { signal: ctrl.signal }).then((r) => {
        if (!r.ok) throw new Error(`github ${r.status}`)
        return r.json()
      }),
      fetch(`${api}/repos?per_page=100&sort=pushed`, { signal: ctrl.signal }).then((r) => {
        if (!r.ok) throw new Error(`github ${r.status}`)
        return r.json()
      }),
    ])
      .then(([u, repos]: [{ public_repos: number; followers: number }, GithubRepo[]]) => {
        const next = { publicRepos: u.public_repos, followers: u.followers, repos }
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
