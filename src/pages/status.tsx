import { Badge } from "@/components/ui/badge"
import { NodeCard } from "@/components/node-card"
import { nodes } from "@/config"
import { useNodeStatus } from "@/hooks/use-node-status"
import { useNow } from "@/hooks/use-now"
import { useTitle } from "@/hooks/use-title"
import { cn } from "@/lib/utils"

function updatedLabel(updatedAt: number | null, now: number, settled: boolean) {
  if (updatedAt == null) return settled ? "No live data" : "Connecting…"
  const secs = Math.max(0, Math.round((now - updatedAt) / 1000))
  if (secs < 5) return "Updated just now"
  if (secs < 60) return `Updated ${secs}s ago`
  return `Updated ${Math.floor(secs / 60)}m ago`
}

export default function Status() {
  useTitle("Status")
  const now = useNow(1000)
  const stateOf = useNodeStatus(nodes.map((n) => n.wsUrl))

  const states = nodes.map((n) => stateOf(n.wsUrl))
  const online = states.filter((s) => s.connection === "online").length
  const settled = states.every((s) => s.connection !== "connecting")
  const updatedAt = states.reduce<number | null>((max, s) => (s.updatedAt && (!max || s.updatedAt > max) ? s.updatedAt : max), null)

  const allUp = online === nodes.length
  const dot = allUp ? "bg-green-500" : online === 0 && settled ? "bg-red-500" : "bg-yellow-500"

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Status</h1>
        <p className="mt-1 text-muted-foreground">Live status for the machines I run.</p>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Badge variant="secondary" className="gap-1.5">
          <span className={cn("size-1.5 rounded-full", settled || online ? dot : "bg-muted-foreground")} aria-hidden="true" />
          {settled || online ? (
            <span className="font-data tabular-nums">
              {online}/{nodes.length} online
            </span>
          ) : (
            "Checking nodes…"
          )}
        </Badge>
        <span className="text-xs text-muted-foreground" aria-live="off">
          {updatedLabel(updatedAt, now, settled)}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {nodes.map((node, i) => (
          <NodeCard key={node.wsUrl} node={node} state={states[i]} />
        ))}
      </div>
    </>
  )
}
