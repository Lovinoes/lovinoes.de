import { ArrowUpRight, Star } from "lucide-react"
import { GithubIcon } from "@/components/brand-icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { profile, type Project } from "@/config"
import type { GithubRepo } from "@/hooks/use-github"
import { fmtRelative } from "@/lib/format"
import constructIcon from "@/assets/images/icon_construct.webp"

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

export function ProjectCard({ project, repo }: { project: Project; repo?: GithubRepo }) {
  const href = repo?.html_url ?? `https://github.com/${profile.githubUser}/${project.repo}`

  return (
    <a href={href} target="_blank" rel="noreferrer" className="group rounded-xl outline-none">
      <Card className="h-full transition-shadow group-hover:ring-foreground/25 group-focus-visible:ring-ring">
        <CardHeader className="flex flex-row items-center gap-2.5">
          <GithubIcon className="size-5 shrink-0" />
          <CardTitle className="min-w-0 flex-1 truncate">{project.name}</CardTitle>
          <ArrowUpRight
            className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-4">
          <CardDescription>{project.description}</CardDescription>
          {repo && (
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
              <span>Updated {fmtRelative(repo.pushed_at)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </a>
  )
}

export function ComingSoonCard() {
  return (
    <Card className="h-full border border-dashed border-border bg-transparent ring-0">
      <CardHeader className="flex flex-row items-center gap-2.5">
        <img src={constructIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
        <CardTitle>Other…</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>Other projects coming soon…</CardDescription>
      </CardContent>
    </Card>
  )
}
