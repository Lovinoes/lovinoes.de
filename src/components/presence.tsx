import { cn } from "@/lib/utils"
import { statusLabel, type DiscordStatus } from "@/hooks/use-lanyard"

const statusColor: Record<DiscordStatus, string> = {
  online: "bg-green-500",
  idle: "bg-yellow-500",
  dnd: "bg-red-500",
  offline: "bg-zinc-500",
}

export function PresenceDot({ status, className }: { status: DiscordStatus; className?: string }) {
  return (
    <span
      className={cn("relative inline-flex size-3 shrink-0 rounded-full", statusColor[status], className)}
      role="img"
      aria-label={statusLabel[status]}
    >
      {status === "online" && (
        <span
          className={cn("absolute inset-0 animate-ping rounded-full opacity-50 motion-reduce:hidden", statusColor[status])}
        />
      )}
    </span>
  )
}
