import { useEffect, useState } from "react"

export type DiscordStatus = "online" | "idle" | "dnd" | "offline"

export const statusLabel: Record<DiscordStatus, string> = {
  online: "Online",
  idle: "Idle",
  dnd: "Do not disturb",
  offline: "Offline",
}

export type LanyardActivity = {
  id: string
  name: string
  /** 0 playing, 1 streaming, 2 listening, 3 watching, 4 custom status, 5 competing */
  type: number
  state?: string
  details?: string
  application_id?: string
  timestamps?: { start?: number; end?: number }
  assets?: {
    large_image?: string
    large_text?: string
    small_image?: string
    small_text?: string
  }
  emoji?: { name: string }
}

export type LanyardSpotify = {
  track_id: string | null
  song: string
  artist: string
  album: string
  album_art_url: string | null
  timestamps: { start: number; end: number }
}

export type LanyardData = {
  discord_status: DiscordStatus
  discord_user: {
    id: string
    username: string
    global_name: string | null
    avatar: string | null
  }
  activities: LanyardActivity[]
  listening_to_spotify: boolean
  spotify: LanyardSpotify | null
}

const POLL_MS = 30_000

/** Discord presence via Lanyard (https://github.com/Phineas/lanyard), polled. */
export function useLanyard(userId: string) {
  const [data, setData] = useState<LanyardData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let inFlight = false

    async function load() {
      timer = undefined
      // No polling in background tabs; onVisible picks it back up.
      if (document.hidden) return
      inFlight = true
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, {
          signal: ctrl.signal,
        })
        const json = await res.json()
        if (!json.success) throw new Error("lanyard")
        setData(json.data)
        setError(false)
      } catch {
        if (ctrl.signal.aborted) return
        setError(true)
      } finally {
        inFlight = false
      }
      if (!ctrl.signal.aborted && !document.hidden) timer = setTimeout(load, POLL_MS)
    }

    const onVisible = () => {
      if (!document.hidden && !timer && !inFlight) load()
    }

    document.addEventListener("visibilitychange", onVisible)
    load()
    return () => {
      ctrl.abort()
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [userId])

  return { data, error, loading: !data && !error }
}

export function discordAvatarUrl(user: LanyardData["discord_user"], size = 256) {
  if (!user.avatar) return null
  const ext = user.avatar.startsWith("a_") ? "gif" : "png"
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`
}

/** Resolves Discord's activity asset keys to real image URLs. */
export function activityImageUrl(activity: LanyardActivity, key?: string) {
  if (!key) return null
  if (key.startsWith("mp:external/")) return `https://media.discordapp.net/external/${key.slice("mp:external/".length)}`
  if (key.startsWith("spotify:")) return `https://i.scdn.co/image/${key.slice("spotify:".length)}`
  if (key.includes(":")) return null // other platform prefixes (twitch:, youtube:) aren't worth resolving
  if (!activity.application_id) return null
  return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${key}.png`
}

const appIcons = new Map<string, Promise<string | null>>()

/** Games without rich-presence art still have an app icon; Discord serves it publicly. */
export function useAppIcon(applicationId: string | undefined, skip: boolean) {
  const [icons, setIcons] = useState<Record<string, string | null>>({})

  useEffect(() => {
    if (!applicationId || skip) return
    let alive = true
    let req = appIcons.get(applicationId)
    if (!req) {
      req = fetch(`https://discord.com/api/v10/applications/${applicationId}/rpc`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { icon?: string | null } | null) =>
          j?.icon ? `https://cdn.discordapp.com/app-icons/${applicationId}/${j.icon}.png?size=128` : null
        )
        .catch(() => null)
      appIcons.set(applicationId, req)
    }
    req.then((url) => {
      if (alive) setIcons((prev) => ({ ...prev, [applicationId]: url }))
    })
    return () => {
      alive = false
    }
  }, [applicationId, skip])

  return applicationId && !skip ? (icons[applicationId] ?? null) : null
}
