// Everything content-related lives here, so editing the site rarely means touching a component.

export const profile = {
  name: "Lovinoes",
  tagline: "PseudoDev",
  location: "I’m just a regular guy from the diverse and lively area near Stuttgart, Germany.",
  email: "lovinoes@lovinoes.de",
  githubUser: "Lovinoes",
  discordId: "904679820124880896",
  mirrorUrl: "https://mirror.lovinoes.de/",
}

export const socials = {
  github: `https://github.com/${profile.githubUser}`,
  twitter: "https://x.com/lovinoes",
  discord: `https://discord.com/users/${profile.discordId}`,
}

export type Project = {
  name: string
  /** GitHub repo name, used for the link and the live stars/language lookup. */
  repo: string
  description: string
}

export const projects: Project[] = [
  {
    name: "Images",
    repo: "images",
    description: "Docker images for Pterodactyl.",
  },
  {
    name: "Autoinstallers",
    repo: "autoinstallers",
    description: "Collection of shell scripts to quickly deploy game servers.",
  },
  {
    name: "ndot-logo-generator",
    repo: "ndot-logo-generator",
    description: "A small vibecoded HTML logo generator using the Nothing fonts.",
  },
  {
    name: "statusserver",
    repo: "statusserver",
    description: "Go agent feeding the live metrics on my status page.",
  },
  {
    name: "errors",
    repo: "errors",
    description: "Dark, minimal HTTP error pages for nginx, Apache, Plesk etc.",
  },
  {
    name: "vitepress-plugin-viewerjs",
    repo: "vitepress-plugin-viewerjs",
    description: "Updated vitepress image viewer plugin based on viewerjs.",
  },
]

export type NodeConfig = {
  /**
   * Websocket endpoint of that node's statusserver agent. A path is resolved against the
   * current site (wss://lovinoes.de/... in production, the Vite proxy in dev); a full
   * wss:// URL works too.
   */
  wsUrl: string
  name: string
  kind: string
  /** Leave out to use what the agent reports (newer statusserver builds send it). */
  cpuModel?: string
  /** Leave out to use the agent's logical core count. */
  cpuCores?: string
  memSpec?: string
}

// To add a node, copy an entry and change the values.
export const nodes: NodeConfig[] = [
  {
    wsUrl: "/status/nodes/hde01/ws",
    name: "HDE-01",
    kind: "Raspberry Pi CM5",
    cpuModel: "Broadcom BCM2712",
    cpuCores: "4 cores",
    memSpec: "16GB LPDDR4X @ 4267 MT/s",
  },
  {
    wsUrl: "/status/nodes/hde02/ws",
    name: "HDE-02",
    kind: "Homeserver",
    cpuModel: "AMD Ryzen™ 9 5900X",
    cpuCores: "12 cores",
    memSpec: "32GB DDR4 @ 3200 MT/s",
  },
  {
    wsUrl: "/status/nodes/hde03/ws",
    name: "HDE-03",
    kind: "KVM QEMU Virtual machine",
    cpuModel: "AMD EPYC™ 7443P",
    cpuCores: "4 cores",
    memSpec: "10GB DDR4 @ 3200 MT/s",
  },
]
