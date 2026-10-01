import type { SVGProps } from "react"
import { siDiscord, siGithub, siSpotify, siX } from "simple-icons"

type IconProps = SVGProps<SVGSVGElement>

function Brand({ path, ...props }: IconProps & { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d={path} />
    </svg>
  )
}

export function GithubIcon(props: IconProps) {
  return <Brand path={siGithub.path} {...props} />
}

export function XIcon(props: IconProps) {
  return <Brand path={siX.path} {...props} />
}

export function DiscordIcon(props: IconProps) {
  return <Brand path={siDiscord.path} {...props} />
}

export function SpotifyIcon(props: IconProps) {
  return <Brand path={siSpotify.path} {...props} />
}
