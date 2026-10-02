import type { ComponentType, ReactNode } from "react"
import { Cpu, HardDrive, Info, MemoryStick, Network } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { NodeConfig } from "@/config"
import type { NodeState } from "@/hooks/use-node-status"
import { fmtBytes, fmtRate } from "@/lib/format"
import { cn } from "@/lib/utils"

function loadColor(pct: number | null) {
  if (pct == null) return "bg-muted-foreground/40"
  if (pct >= 75) return "bg-orange-500"
  if (pct >= 60) return "bg-yellow-500"
  return "bg-green-500"
}

/** Busier direction as a share of the link speed (max_mbps is megabits). */
function linkUsage(n: { rx_bytes_per_sec?: number; tx_bytes_per_sec?: number; max_mbps?: number }) {
  if (!n.max_mbps) return null
  const peak = Math.max(Number(n.rx_bytes_per_sec) || 0, Number(n.tx_bytes_per_sec) || 0)
  return Math.min(100, ((peak * 8) / (n.max_mbps * 1_000_000)) * 100)
}

function fmtLink(mbps: number) {
  return mbps >= 1000 ? `${mbps / 1000} Gbit/s` : `${mbps} Mbit/s`
}

function num(v: unknown): number | null {
  return v == null || Number.isNaN(Number(v)) ? null : Number(v)
}

function Metric({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  /** Extra info, shown on hover/focus of an icon next to the label. */
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="size-4 text-muted-foreground" />
        {label}
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={hint}
                className="inline-flex cursor-help rounded-full text-muted-foreground/70 transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-60">{hint}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex flex-col gap-1.5 font-data text-xs text-muted-foreground tabular-nums">{children}</div>
    </div>
  )
}

function Bar({ pct, digits }: { pct: number | null; digits: number }) {
  return (
    <div className="flex items-center gap-2">
      <Progress value={pct} className="flex-1" indicatorClassName={cn("duration-500", loadColor(pct))} />
      {/* fixed width so the bar doesn't jitter as the number changes */}
      <span className="w-12 shrink-0 text-right text-foreground">{pct == null ? "—" : `${pct.toFixed(digits)}%`}</span>
    </div>
  )
}

const uptimeWindows = [
  ["7d", "percent_7d"],
  ["30d", "percent_30d"],
  ["365d", "percent_365d"],
] as const

export function NodeCard({ node, state }: { node: NodeConfig; state: NodeState }) {
  const { metrics, connection } = state
  const offline = connection === "offline"

  const cpu = metrics?.cpu
  const cpuPct = num(cpu?.usage_percent)
  const temp = num(cpu?.temperature_c)
  // Config wins (hand-written, nicer names); newer agents fill in the rest.
  const cpuModel = node.cpuModel ?? (cpu?.model || null)
  const cpuCores = node.cpuCores ?? (cpu?.cores ? `${cpu.cores} threads` : null)

  const host = metrics?.host
  const os = [host?.platform, host?.platform_version].filter(Boolean).join(" ")
  const hostInfo = [os, host?.arch].filter(Boolean).join(" · ")

  const mem = metrics?.memory
  const memPct = num(mem?.used_percent)

  // All mounts aggregated into one bar: total used across all of them.
  const mounts = metrics?.storage ?? []
  const used = mounts.reduce((n, s) => n + (Number(s.used_bytes) || 0), 0)
  const total = mounts.reduce((n, s) => n + (Number(s.total_bytes) || 0), 0)
  const storagePct = total ? (used / total) * 100 : null

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <CardTitle className="text-lg">{node.name}</CardTitle>
          <span className="text-xs text-muted-foreground">{node.kind}</span>
        </div>
        {connection === "online" && metrics?.uptime?.human ? (
          <Badge variant="secondary" className="font-data tabular-nums">
            <span className="size-1.5 rounded-full bg-green-500" aria-hidden="true" />
            up {metrics.uptime.human}
          </Badge>
        ) : offline ? (
          <Badge variant="destructive">
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            offline
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            connecting…
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {offline && (
          <p className="text-sm text-destructive">
            Unable to reach this node.{metrics && " Showing the last known values."}
          </p>
        )}
        <div className={cn("grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-4", offline && "opacity-50")}>
          <Metric icon={Cpu} label="CPU">
            {cpuModel && <p className="text-foreground">{cpuModel}</p>}
            {cpuCores && <p>{cpuCores}</p>}
            <Bar pct={cpuPct} digits={1} />
            {(temp != null || cpu?.load) && (
              <p>
                {[
                  temp != null && `${temp.toFixed(1)}°C`,
                  cpu?.load &&
                    `load ${[cpu.load.load1, cpu.load.load5, cpu.load.load15].map((l) => l.toFixed(2)).join(" ")}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </Metric>

          <Metric icon={MemoryStick} label="Memory">
            {node.memSpec && <p className="text-foreground">{node.memSpec}</p>}
            <Bar pct={memPct} digits={1} />
            {mem && (
              <p>
                {mem.used_human ?? fmtBytes(mem.used_bytes)} / {mem.total_human ?? fmtBytes(mem.total_bytes)}
              </p>
            )}
          </Metric>

          <Metric
            icon={HardDrive}
            label="Storage"
            hint="Storage devices aren’t always detected or displayed correctly."
          >
            {mounts.length ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p
                    tabIndex={0}
                    className="w-fit cursor-help text-foreground underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {mounts.length} {mounts.length === 1 ? "mount" : "mounts"}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="flex-col items-start gap-0.5 font-data tabular-nums">
                  {mounts.map((m) => (
                    <span key={m.mount}>
                      <span className="font-medium">{m.mount}</span> · {m.used_human ?? fmtBytes(m.used_bytes)} /{" "}
                      {m.total_human ?? fmtBytes(m.total_bytes)}
                      {m.fstype && <span className="opacity-60"> ({m.fstype})</span>}
                    </span>
                  ))}
                </TooltipContent>
              </Tooltip>
            ) : (
              <p className="text-foreground">—</p>
            )}
            <Bar pct={storagePct} digits={0} />
            {total > 0 && (
              <p>
                {fmtBytes(used)} / {fmtBytes(total)}
              </p>
            )}
          </Metric>

          <Metric icon={Network} label="Network">
            {metrics?.network?.length ? (
              metrics.network.map((n) => {
                const link = linkUsage(n)
                return (
                  <div key={n.interface} className="flex flex-col gap-0.5">
                    <p className="text-foreground">
                      {n.interface}
                      {n.max_mbps ? <span className="text-muted-foreground"> · {fmtLink(n.max_mbps)}</span> : null}
                    </p>
                    {link != null && <Bar pct={link} digits={1} />}
                    <p>↑ {n.tx_human ?? fmtRate(n.tx_bytes_per_sec)}</p>
                    <p>↓ {n.rx_human ?? fmtRate(n.rx_bytes_per_sec)}</p>
                  </div>
                )
              })
            ) : (
              <p>—</p>
            )}
          </Metric>
        </div>
      </CardContent>

      <CardFooter className="flex-wrap gap-x-5 gap-y-1 py-3 text-xs text-muted-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Agent uptime
            </span>
          </TooltipTrigger>
          <TooltipContent>How reliably the statusserver agent on this node has been running and reporting.</TooltipContent>
        </Tooltip>
        {uptimeWindows.map(([label, key]) => {
          const v = num(metrics?.uptime?.[key])
          return (
            <span key={key} className="font-data tabular-nums">
              {label} <span className="text-foreground">{v == null ? "—" : `${v}%`}</span>
            </span>
          )
        })}
        {hostInfo && (
          <span className="ml-auto font-data" title={host?.kernel_version ? `Kernel ${host.kernel_version}` : undefined}>
            {hostInfo}
          </span>
        )}
      </CardFooter>
    </Card>
  )
}
