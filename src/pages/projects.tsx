import { ArrowUpRight } from "lucide-react"
import { GithubIcon } from "@/components/brand-icons"
import { ComingSoonCard, ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { profile, projects, socials } from "@/config"
import { useGithub } from "@/hooks/use-github"
import { useTitle } from "@/hooks/use-title"

export default function Projects() {
  useTitle("Projects")
  const github = useGithub(profile.githubUser)
  const repoByName = new Map(github.data?.repos.map((r) => [r.name.toLowerCase(), r]))

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-muted-foreground">Things I’ve built or maintain, with live stats from GitHub.</p>
        </div>
        <Button variant="outline" size="sm" asChild className="w-fit">
          <a href={`${socials.github}?tab=repositories`} target="_blank" rel="noreferrer">
            <GithubIcon /> All repositories <ArrowUpRight />
          </a>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.repo} project={p} repo={repoByName.get(p.repo.toLowerCase())} />
        ))}
        <ComingSoonCard />
      </div>
    </>
  )
}
