// Everything content-related lives here, so editing the site rarely means touching a component.

export const profile = {
  name: "Lovinoes",
  tagline: "PseudoDev",
  location: "I’m just a regular guy from the diverse and lively area near Stuttgart, Germany.",
  email: "lovinoes@lovinoes.de",
  githubUser: "Lovinoes",
  discordId: "904679820124880896",
}

export const socials = {
  github: `https://github.com/${profile.githubUser}`,
  twitter: "https://x.com/lovinoes",
  discord: `https://discord.com/users/${profile.discordId}`,
}

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
  /** Shown as a second line under memSpec, e.g. "ECC". */
  memEcc?: string
  /** The agent only sees the combined volume, so things like RAID go here. */
  storageSpec?: string
  /** Shown when hovering storageSpec, e.g. to say the RAID is on the VM's host. */
  storageSpecHint?: string
}

// To add a node, copy an entry and change the values.
export const nodes: NodeConfig[] = [
  {
    wsUrl: "/status/nodes/hde01/ws",
    name: "HDE-01",
    kind: "Dedicated Server",
    cpuModel: "AMD Ryzen™ 7 PRO 8700GE",
    cpuCores: "8 cores / 16 threads",
    memSpec: "64GB DDR5 @ 5600 MT/s",
    memEcc: "ODECC",
    storageSpec: "RAID 1",
  },
  {
    wsUrl: "/status/nodes/hde02/ws",
    name: "HDE-02",
    kind: "KVM QEMU Virtual machine",
    cpuModel: "AMD EPYC™ 7443P",
    cpuCores: "4 cores",
    memSpec: "10GB DDR4 @ 3200 MT/s",
    memEcc: "ECC",
    storageSpec: "RAID 1",
    storageSpecHint: "Host-side",
  },
]
