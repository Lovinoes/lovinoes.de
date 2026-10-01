import type { MouseEvent } from "react"
import { ArrowUpRight } from "lucide-react"
import { NavLink } from "react-router"
import { cn } from "@/lib/utils"
import { profile } from "@/config"

const linkClass = "rounded-md px-2.5 py-1.5 text-sm transition-colors sm:px-3"
const idleClass = "text-muted-foreground hover:bg-accent/50 hover:text-foreground"

// Mirror is a real navigation to another origin, so the browser would hard-cut to it.
// Fade the page content out first, like the in-app route changes fade in.
function fadeThenGo(e: MouseEvent<HTMLAnchorElement>) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
  e.preventDefault()
  const href = e.currentTarget.href
  document.body.classList.add("leaving")
  setTimeout(() => location.assign(href), 150)
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-end px-4">
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {[
            { to: "/", label: "Home" },
            { to: "/projects", label: "Projects" },
            { to: "/status", label: "Status" },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(linkClass, isActive ? "bg-accent text-accent-foreground" : idleClass)
              }
            >
              {label}
            </NavLink>
          ))}
          <a
            href={profile.mirrorUrl}
            onClick={fadeThenGo}
            className={cn(linkClass, idleClass, "inline-flex items-center gap-0.5")}
          >
            Mirror
            <ArrowUpRight className="hidden size-3.5 opacity-60 sm:block" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  )
}
