import { NavLink } from "react-router"
import { cn } from "@/lib/utils"

const links = [
  { to: "/", label: "Home" },
  { to: "/projects", label: "Projects" },
  { to: "/status", label: "Status" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-end px-4">
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  "rounded-md px-2.5 py-1.5 text-sm transition-colors sm:px-3",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
