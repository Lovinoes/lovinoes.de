import { profile } from "@/config"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 py-6">
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">
          {profile.name} ·{" "}
          <a href="https://lovinoes.de/" className="transition-colors hover:text-foreground">
            lovinoes.de
          </a>
        </p>
      </div>
    </footer>
  )
}
