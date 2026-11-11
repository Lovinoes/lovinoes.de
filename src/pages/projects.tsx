import { ArrowUpRight } from "lucide-react"
import { GithubIcon } from "@/components/brand-icons"
import {
  GithubUnavailable,
  OrgCard,
  OrgCardSkeleton,
  ProjectCard,
  ProjectCardSkeleton,
} from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { profile, socials } from "@/config"
import { sortRepos, useGithub } from "@/hooks/use-github"
import { useTitle } from "@/hooks/use-title"

const grid = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"

export default function Projects() {
  useTitle("Projects")
  const github = useGithub(profile.githubUser)
  const repos = github.data ? sortRepos(github.data.repos) : []
  const orgs = github.data?.orgs ?? []

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-muted-foreground">All my public repositories, with live stats from GitHub.</p>
        </div>
        <Button variant="outline" size="sm" asChild className="w-fit">
          <a href={`${socials.github}?tab=repositories`} target="_blank" rel="noreferrer">
            <GithubIcon /> View on GitHub <ArrowUpRight />
          </a>
        </Button>
      </div>

      {github.error ? (
        <GithubUnavailable what="my repositories" />
      ) : (
        <div className={grid} aria-busy={github.loading}>
          {github.loading
            ? Array.from({ length: 6 }, (_, i) => <ProjectCardSkeleton key={i} />)
            : repos.map((r) => <ProjectCard key={r.name} repo={r} />)}
        </div>
      )}
      {github.data && repos.length === 0 && (
        <p className="text-sm text-muted-foreground">No public repositories yet.</p>
      )}

      {(github.loading || orgs.length > 0) && (
        <section className="pt-12">
          <h2 className="mb-4 text-2xl font-bold tracking-tight">Organizations</h2>
          <div className={grid} aria-busy={github.loading}>
            {github.loading ? <OrgCardSkeleton /> : orgs.map((o) => <OrgCard key={o.login} org={o} />)}
          </div>
        </section>
      )}
    </>
  )
}
