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

const RECONNECT_MS = 5000

function resolveWsUrl(url: string) {
  if (!url.startsWith("/")) return url
  return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}${url}`
}

const initial: NodeState = { metrics: null, connection: "connecting", updatedAt: null }

/**
 * One persistent websocket per node URL, each reconnecting 5s after it drops. Sockets
 * only live while the component using this is mounted, so visitors who never open the
 * Status page never connect. Last known metrics are kept while a node is offline.
 */
export function useNodeStatus(urls: string[]) {
  const [states, setStates] = useState<Record<string, NodeState>>({})
  const key = urls.join(" ")

  useEffect(() => {
    const list = key ? key.split(" ") : []
    let disposed = false
    const sockets = new Map<string, WebSocket>()
    const timers = new Map<string, ReturnType<typeof setTimeout>>()

    const patch = (url: string, next: Partial<NodeState>) =>
      setStates((prev) => ({ ...prev, [url]: { ...(prev[url] ?? initial), ...next } }))

    const scheduleReconnect = (url: string) => {
      if (disposed || timers.has(url)) return
      timers.set(
        url,
        setTimeout(() => {
          timers.delete(url)
          open(url)
        }, RECONNECT_MS)
      )
    }

    function open(url: string) {
      let ws: WebSocket
      try {
        ws = new WebSocket(resolveWsUrl(url))
      } catch {
        patch(url, { connection: "offline" })
        scheduleReconnect(url)
        return
      }
      sockets.set(url, ws)

      ws.onmessage = (event) => {
        let data: NodeMetrics
        try {
          data = JSON.parse(event.data)
        } catch {
          return // ignore malformed frames
        }
        patch(url, { metrics: data, connection: "online", updatedAt: Date.now() })
      }
      ws.onclose = () => {
        sockets.delete(url)
        if (disposed) return
        patch(url, { connection: "offline" })
        scheduleReconnect(url)
      }
      ws.onerror = () => ws.close()
    }

    list.forEach(open)

    return () => {
      disposed = true
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
