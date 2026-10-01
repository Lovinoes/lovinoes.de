import { ArrowRight, Mail, Server, Star } from "lucide-react"
import { Link } from "react-router"
import { ActivityCard } from "@/components/activity-card"
import { DiscordIcon, GithubIcon, XIcon } from "@/components/brand-icons"
import { PresenceDot } from "@/components/presence"
import { ProjectCard } from "@/components/project-card"
import { StatCard } from "@/components/stat-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { nodes, profile, projects, socials } from "@/config"
import { useGithub } from "@/hooks/use-github"
import { discordAvatarUrl, statusLabel, useLanyard } from "@/hooks/use-lanyard"
import { useTitle } from "@/hooks/use-title"

const FEATURED = 4

export default function Home() {
  useTitle()
  const lanyard = useLanyard(profile.discordId)
  const github = useGithub(profile.githubUser)

  const presence = lanyard.data
  const avatar = presence ? discordAvatarUrl(presence.discord_user) : null
  const customStatus = presence?.activities.find((a) => a.type === 4)
  const repoByName = new Map(github.data?.repos.map((r) => [r.name.toLowerCase(), r]))
  const stars = github.data?.repos.filter((r) => !r.fork).reduce((n, r) => n + r.stargazers_count, 0)

  return (
    <>
      <section className="flex flex-col-reverse gap-8 pt-8 pb-16 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">Hi, I’m {profile.name}</h1>
            {presence && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                    <PresenceDot status={presence.discord_status} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{statusLabel[presence.discord_status]} on Discord</TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{profile.tagline}</p>
          <div className="flex max-w-md flex-col gap-3 text-muted-foreground">
            <p>
              {profile.location} If you’d like to get in touch, feel free to send me an email at{" "}
              <a
                href={`mailto:${profile.email}`}
                className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
              >
                {profile.email}
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${profile.email}`}>
                <Mail /> Contact
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={socials.github} target="_blank" rel="noreferrer">
                <GithubIcon /> GitHub
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={socials.twitter} target="_blank" rel="noreferrer">
                <XIcon /> Twitter
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={socials.discord} target="_blank" rel="noreferrer">
                <DiscordIcon /> Discord
              </a>
            </Button>
          </div>
        </div>
        <Avatar className="size-28 ring-1 ring-border md:size-44">
          {avatar && <AvatarImage src={avatar} alt={profile.name} />}
          <AvatarFallback className="text-3xl font-bold md:text-5xl">{profile.name[0]}</AvatarFallback>
        </Avatar>
      </section>

      <section className="grid grid-cols-2 items-stretch gap-3 pb-6 md:grid-cols-4">
        <StatCard
          title="Discord"
          icon={DiscordIcon}
          href={socials.discord}
          loading={lanyard.loading}
          value={presence ? statusLabel[presence.discord_status] : "—"}
          sub={
            customStatus?.state ??
            (presence ? `@${presence.discord_user.username}` : "presence unavailable")
          }
        />
        <StatCard
          title="Repositories"
          icon={GithubIcon}
          href={`${socials.github}?tab=repositories`}
          loading={github.loading}
          value={github.data?.publicRepos ?? "—"}
          sub={github.data ? `${github.data.followers} followers` : "GitHub unavailable"}
        />
        <StatCard
          title="Stars"
          icon={Star}
          href={socials.github}
          loading={github.loading}
          value={stars ?? "—"}
          sub="on my own repos"
        />
        <StatCard
          title="Servers"
          icon={Server}
          href="/status"
          internal
          value={nodes.length}
          sub="live status"
        />
      </section>

      <section className="pb-16">
        <ActivityCard data={presence} loading={lanyard.loading} />
      </section>

      <section className="pb-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/projects">
              All projects <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.slice(0, FEATURED).map((p) => (
            <ProjectCard key={p.repo} project={p} repo={repoByName.get(p.repo.toLowerCase())} />
          ))}
        </div>
      </section>
    </>
  )
}
