import { ArrowUpRight, Star } from "lucide-react"
import { GithubIcon } from "@/components/brand-icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { profile } from "@/config"
import { orgAvatarUrl, type GithubOrg, type GithubRepo } from "@/hooks/use-github"
import { fmtRelative } from "@/lib/format"

// GitHub's linguist colours for the languages that actually show up here.
const languageColor: Record<string, string> = {
  Shell: "#89e051",
  Dockerfile: "#384d54",
  HTML: "#e34c26",
  CSS: "#663399",
  Go: "#00ADD8",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  PHP: "#4F5D95",
  Vue: "#41b883",
}

const cardClass = "h-full transition-shadow group-hover:ring-foreground/25 group-focus-visible:ring-ring"

function HoverArrow() {
  return (
    <ArrowUpRight
      className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
      aria-hidden="true"
    />
  )
}

export function ProjectCard({ repo }: { repo: GithubRepo }) {
  // Only the (encoded) name comes from the API, so a bad response can't point the link elsewhere.
  const href = `https://github.com/${encodeURIComponent(profile.githubUser)}/${encodeURIComponent(repo.name)}`

  return (
    <a href={href} target="_blank" rel="noreferrer" className="group rounded-xl outline-none">
      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center gap-2.5">
          <GithubIcon className="size-5 shrink-0" />
          <CardTitle className="min-w-0 truncate">{repo.name}</CardTitle>
          {repo.archived && (
            <Badge variant="outline" className="border-yellow-400/30 bg-yellow-400/10 text-yellow-400">
              Archived
            </Badge>
          )}
          {repo.fork && (
            <Badge variant="outline" className="text-muted-foreground">
              Fork
            </Badge>
          )}
          <HoverArrow />
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-4">
          {repo.description ? (
            <CardDescription className="line-clamp-3">{repo.description}</CardDescription>
          ) : (
            <CardDescription className="italic opacity-70">No description</CardDescription>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-data text-xs text-muted-foreground">
            {repo.language && (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: languageColor[repo.language] ?? "var(--muted-foreground)" }}
                />
                {repo.language}
              </span>
            )}
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Star className="size-3.5" aria-hidden="true" />
              {repo.stargazers_count}
              <span className="sr-only">stars</span>
            </span>
            {repo.pushed_at && <span>Updated {fmtRelative(repo.pushed_at)}</span>}
          </div>
        </CardContent>
      </Card>
    </a>
  )
}

export function ProjectCardSkeleton() {
  return (
    <Card className="h-full" aria-hidden="true">
      <CardHeader className="flex flex-row items-center gap-2.5">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  )
}

export function OrgCard({ org }: { org: GithubOrg }) {
  const href = `https://github.com/${encodeURIComponent(org.login)}`

  return (
    <a href={href} target="_blank" rel="noreferrer" className="group rounded-xl outline-none">
      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center gap-3">
          {/* GitHub draws organisation avatars as rounded squares, not circles */}
          <Avatar className="size-10 rounded-md after:rounded-md">
            <AvatarImage src={orgAvatarUrl(org)} alt="" className="rounded-md" />
            <AvatarFallback className="rounded-md font-bold">{org.login[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <CardTitle className="truncate">{org.login}</CardTitle>
            {org.description && <CardDescription className="line-clamp-2">{org.description}</CardDescription>}
          </div>
          <HoverArrow />
        </CardHeader>
      </Card>
    </a>
  )
}

export function OrgCardSkeleton() {
  return (
    <Card className="h-full" aria-hidden="true">
      <CardHeader className="flex flex-row items-center gap-3">
        <Skeleton className="size-10 rounded-md" />
        <Skeleton className="h-4 w-28" />
      </CardHeader>
    </Card>
  )
}

export function GithubUnavailable({ what }: { what: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Couldn’t load {what} from GitHub right now.{" "}
          <a
            href={`https://github.com/${encodeURIComponent(profile.githubUser)}?tab=repositories`}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
          >
            See them on GitHub
          </a>
          .
        </p>
      </CardContent>
    </Card>
  )
}
