import { useEffect, useState } from "react"

// Snapshot frames sent by https://github.com/Lovinoes/statusserver (see its docs/API.md).
// Everything is optional: older agents don't send host, cpu.model/cores/load yet.
export type NodeMetrics = {
  timestamp: string
  host?: {
    hostname?: string
    os?: string
    platform?: string
    platform_version?: string
    kernel_version?: string
    arch?: string
  }
  cpu?: {
    usage_percent?: number | null
    /** null when the machine has no sensor (common on VMs) */
    temperature_c?: number | null
    model?: string
    /** logical cores */
    cores?: number
    /** null on Windows */
    load?: { load1: number; load5: number; load15: number } | null
  }
  memory?: {
    total_bytes?: number
    used_bytes?: number
    used_percent?: number
    total_human?: string
    used_human?: string
  }
  storage?: {
    mount: string
    device?: string
    fstype?: string
    total_bytes?: number
    used_bytes?: number
    used_percent?: number
    total_human?: string
    used_human?: string
  }[]
  network?: {
    interface: string
    rx_bytes_per_sec?: number
    tx_bytes_per_sec?: number
    rx_human?: string
    tx_human?: string
    rx_total_bytes?: number
    tx_total_bytes?: number
    /** link speed, only sent when network_max_mbps is configured on the agent */
    max_mbps?: number
  }[]
  uptime?: {
    /** host uptime */
    seconds?: number
    human?: string
    /** how reliably the agent itself ran and reported, not the host's uptime */
    percent_7d?: number
    percent_14d?: number
    percent_30d?: number
    percent_365d?: number
  }
}

export type NodeConnection = "connecting" | "online" | "offline"

export type NodeState = {
  metrics: NodeMetrics | null
  connection: NodeConnection
  /** Local time of the last frame received. */
  updatedAt: number | null
}

/** First reconnect delay; doubles per failed attempt up to RETRY_MAX_MS. */
const RETRY_MIN_MS = 1000
const RETRY_MAX_MS = 30_000
/** Failed attempts in a row before a node is shown as offline, so one hiccup doesn't flash the error. */
const OFFLINE_AFTER = 2
/** A handshake that hasn't finished by then is given up and retried. */
const CONNECT_TIMEOUT_MS = 15_000
/** An open socket that has sent nothing for this long is treated as dead (the agent sends every few seconds). */
const STALE_MS = 30_000

function resolveWsUrl(url: string) {
  if (!url.startsWith("/")) return url
  return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}${url}`
}

/** The agent's /api/status next to its /ws, e.g. /status/nodes/hde01/ws -> /status/nodes/hde01/api/status. */
function resolveApiUrl(url: string) {
  if (!url.endsWith("/ws")) return null
  const base = url.slice(0, -"/ws".length)
  return `${base.startsWith("/") ? base : base.replace(/^ws/, "http")}/api/status`
}

const initial: NodeState = { metrics: null, connection: "connecting", updatedAt: null }

/**
 * One persistent websocket per node URL. Each node's current snapshot is also fetched
 * once over HTTP, so cards fill in right away instead of waiting for their socket (Firefox
 * opens sockets to the same host one at a time). Dropped or stuck sockets reconnect with
 * backoff. Sockets only live while the component using this is mounted, so visitors who
 * never open the Status page never connect. Last known metrics are kept while a node is
 * offline.
 */
export function useNodeStatus(urls: string[]) {
  const [states, setStates] = useState<Record<string, NodeState>>({})
  const key = urls.join(" ")

  useEffect(() => {
    const list = key ? key.split(" ") : []
    let disposed = false
    const sockets = new Map<string, WebSocket>()
    const timers = new Map<string, ReturnType<typeof setTimeout>>()
    const failures = new Map<string, number>()
    const delays = new Map<string, number>()
    /** Local time of the last frame (or of the connect attempt, before the first one). */
    const lastSeen = new Map<string, number>()
    /** Agent timestamp of the newest snapshot shown, so a late HTTP reply can't overwrite newer data. */
    const newest = new Map<string, number>()
    const fetches = new AbortController()

    const patch = (url: string, next: Partial<NodeState>) =>
      setStates((prev) => ({ ...prev, [url]: { ...(prev[url] ?? initial), ...next } }))

    const show = (url: string, data: NodeMetrics) => {
      const ts = Date.parse(data.timestamp)
      if (!Number.isNaN(ts)) {
        const prev = newest.get(url)
        if (prev != null && ts < prev) return
        newest.set(url, ts)
      }
      failures.set(url, 0)
      delays.delete(url)
      patch(url, { metrics: data, connection: "online", updatedAt: Date.now() })
    }

    const scheduleReconnect = (url: string) => {
      if (disposed || timers.has(url)) return
      const delay = delays.get(url) ?? RETRY_MIN_MS
      delays.set(url, Math.min(delay * 2, RETRY_MAX_MS))
      timers.set(
        url,
        // jitter, so nodes that failed together don't all retry at the same moment
        setTimeout(() => {
          timers.delete(url)
          open(url)
        }, delay + Math.random() * 500)
      )
    }

    const fail = (url: string) => {
      const n = (failures.get(url) ?? 0) + 1
      failures.set(url, n)
      patch(url, { connection: n >= OFFLINE_AFTER ? "offline" : "connecting" })
      scheduleReconnect(url)
    }

    /** Drops a socket without waiting for its close handshake (which never ends on a dead link). */
    const abandon = (url: string, ws: WebSocket) => {
      ws.onclose = null
      ws.onerror = null
      ws.onmessage = null
      ws.close()
      sockets.delete(url)
      fail(url)
    }

    function open(url: string) {
      let ws: WebSocket
      try {
        ws = new WebSocket(resolveWsUrl(url))
      } catch {
        fail(url)
        return
      }
      sockets.set(url, ws)
      lastSeen.set(url, Date.now())

      ws.onmessage = (event) => {
        lastSeen.set(url, Date.now())
        let data: NodeMetrics
        try {
          data = JSON.parse(event.data)
        } catch {
          return // ignore malformed frames
        }
        show(url, data)
      }
      ws.onclose = () => {
        sockets.delete(url)
        if (disposed) return
        fail(url)
      }
      ws.onerror = () => ws.close()
    }

    async function fetchOnce(url: string) {
      const api = resolveApiUrl(url)
      if (!api) return
      try {
        const res = await fetch(api, { cache: "no-store", signal: fetches.signal })
        if (!res.ok) return // e.g. 503 right after the agent started; the socket will deliver
        const data: NodeMetrics = await res.json()
        if (!disposed) show(url, data)
      } catch {
        // offline, aborted or malformed: the socket decides the node's state
      }
    }

    const watchdog = setInterval(() => {
      const now = Date.now()
      sockets.forEach((ws, url) => {
        const quiet = now - (lastSeen.get(url) ?? now)
        if (
          (ws.readyState === WebSocket.CONNECTING && quiet > CONNECT_TIMEOUT_MS) ||
          (ws.readyState === WebSocket.OPEN && quiet > STALE_MS)
        ) {
          abandon(url, ws)
        }
      })
    }, 5000)

    // Back from a sleeping laptop or a background tab: retry right away instead of
    // sitting out a long backoff.
    const onWake = () => {
      if (document.visibilityState !== "visible") return
      // copy first: open() can schedule a new timer for the same node
      for (const [url, timer] of [...timers]) {
        clearTimeout(timer)
        timers.delete(url)
        delays.delete(url)
        open(url)
      }
    }
    document.addEventListener("visibilitychange", onWake)
    window.addEventListener("online", onWake)

    list.forEach((url) => {
      void fetchOnce(url)
      open(url)
    })

    return () => {
      disposed = true
      fetches.abort()
      clearInterval(watchdog)
      document.removeEventListener("visibilitychange", onWake)
      window.removeEventListener("online", onWake)
      timers.forEach(clearTimeout)
      sockets.forEach((ws) => {
        ws.onclose = null
        ws.onerror = null
        ws.onmessage = null
        ws.close()
      })
    }
  }, [key])

  return (url: string): NodeState => states[url] ?? initial
}
