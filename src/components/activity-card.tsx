import { useState, type ReactNode } from "react"
import { Gamepad2, Moon } from "lucide-react"
import { SpotifyIcon } from "@/components/brand-icons"
import { PresenceDot } from "@/components/presence"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { activityImageUrl, statusLabel, useAppIcon, type LanyardActivity, type LanyardData } from "@/hooks/use-lanyard"
import { useNow } from "@/hooks/use-now"
import { fmtClock, fmtDuration } from "@/lib/format"

const verb: Record<number, string> = {
  0: "Playing",
  1: "Streaming",
  2: "Listening to",
  3: "Watching",
  5: "Competing in",
}

function Cover({ src, fallback }: { src: string | null; fallback: ReactNode }) {
  // Remember which URL failed, so the next song/game's art still gets a chance to load.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  return (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
      {src && src !== failedSrc ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        fallback
      )}
    </div>
  )
}

function Spotify({ spotify }: { spotify: NonNullable<LanyardData["spotify"]> }) {
  const now = useNow(1000)
  const { start, end } = spotify.timestamps
  const total = end - start
  const elapsed = Math.min(Math.max(now - start, 0), total)
  const song = (
    <span className="truncate font-medium">{spotify.song}</span>
  )

  return (
    <div className="flex items-center gap-4">
      <Cover src={spotify.album_art_url} fallback={<SpotifyIcon className="size-7 text-[#1DB954]" />} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SpotifyIcon className="size-3 text-[#1DB954]" /> Listening on Spotify
        </p>
        {spotify.track_id ? (
          <a
            href={`https://open.spotify.com/track/${spotify.track_id}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 hover:underline"
          >
            {song}
          </a>
        ) : (
          <p className="flex min-w-0">{song}</p>
        )}
        <p className="truncate text-xs text-muted-foreground">by {spotify.artist.replaceAll(";", ",")}</p>
        <div className="mt-1.5 flex items-center gap-2 font-data text-[0.7rem] text-muted-foreground tabular-nums">
          <span>{fmtClock(elapsed)}</span>
          <Progress value={total > 0 ? (elapsed / total) * 100 : 0} indicatorClassName="bg-[#1DB954]" />
          <span>{fmtClock(total)}</span>
        </div>
      </div>
    </div>
  )
}

function Activity({ activity }: { activity: LanyardActivity }) {
  const now = useNow(1000)
  const art = activityImageUrl(activity, activity.assets?.large_image)
  const appIcon = useAppIcon(activity.application_id, art != null)
  const image = art ?? appIcon
  const start = activity.timestamps?.start

  return (
    <div className="flex items-center gap-4">
      <Cover src={image} fallback={<Gamepad2 className="size-7 text-muted-foreground" />} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-xs text-muted-foreground">{verb[activity.type] ?? "Playing"}</p>
        <p className="truncate font-medium">{activity.name}</p>
        {activity.details && <p className="truncate text-xs text-muted-foreground">{activity.details}</p>}
        {activity.state && <p className="truncate text-xs text-muted-foreground">{activity.state}</p>}
        {start && (
          <p className="font-data text-xs text-muted-foreground tabular-nums">for {fmtDuration(now - start)}</p>
        )}
      </div>
    </div>
  )
}

export function ActivityCard({ data, loading }: { data: LanyardData | null; loading: boolean }) {
  // Custom statuses (type 4) aren't activities in the "doing something" sense.
  const activity = data?.activities.find((a) => a.type !== 4 && a.name !== "Spotify")
  const spotify = data?.listening_to_spotify ? data.spotify : null

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">Activity</CardTitle>
        {data && (
          <Badge variant="secondary" className="gap-1.5">
            <PresenceDot status={data.discord_status} className="size-2" />
            {statusLabel[data.discord_status]}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {loading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">Couldn’t load Discord presence right now.</p>
        ) : !spotify && !activity ? (
          <div className="flex items-center gap-4">
            <Cover src={null} fallback={<Moon className="size-7 text-muted-foreground" />} />
            <div className="flex flex-col gap-0.5">
              <p className="font-medium">Nothing going on</p>
              <p className="text-xs text-muted-foreground">
                {data.discord_status === "offline" ? "Probably away from the keyboard." : "Not playing or listening to anything right now."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {activity && <Activity activity={activity} />}
            {spotify && <Spotify spotify={spotify} />}
          </>
        )}
      </CardContent>
    </Card>
  )
}
