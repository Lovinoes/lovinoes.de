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

// Everything is nullable: for local files Lanyard sends no artist, cover or track id.
export type LanyardSpotify = {
  track_id: string | null
  song: string | null
  artist: string | null
  album: string | null
  album_art_url: string | null
  timestamps: { start?: number; end?: number } | null
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

/**
 * Lanyard's payload comes from outside, so shape it once here: every component below can
 * then trust the types instead of guarding each field.
 */
function normalize(raw: unknown, userId: string): LanyardData {
  if (!raw || typeof raw !== "object") throw new Error("lanyard: no data")
  const d = raw as Partial<LanyardData>
  const user = d.discord_user
  return {
    discord_status:
      typeof d.discord_status === "string" && Object.hasOwn(statusLabel, d.discord_status) ? d.discord_status : "offline",
    discord_user: {
      id: typeof user?.id === "string" ? user.id : userId,
      username: typeof user?.username === "string" ? user.username : "",
      global_name: typeof user?.global_name === "string" ? user.global_name : null,
      avatar: typeof user?.avatar === "string" ? user.avatar : null,
    },
    activities: Array.isArray(d.activities)
      ? d.activities.filter((a): a is LanyardActivity => !!a && typeof a.name === "string" && typeof a.type === "number")
      : [],
    listening_to_spotify: d.listening_to_spotify === true,
    spotify: d.listening_to_spotify === true && d.spotify && typeof d.spotify === "object" ? d.spotify : null,
  }
}

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
        if (!json?.success) throw new Error("lanyard")
        setData(normalize(json.data, userId))
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
