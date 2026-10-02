import { ArrowLeft, House, RotateCw } from "lucide-react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { useTitle } from "@/hooks/use-title"
import { fallbackError, httpErrors } from "@/lib/errors"

export default function ErrorPage({ code }: { code: number }) {
  useTitle(String(code))
  const { title, message } = httpErrors[code] ?? fallbackError
  // Opened directly (new tab, typed URL) there's nothing to go back to.
  const canGoBack = history.length > 1

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="font-data text-sm text-muted-foreground tabular-nums">{code}</p>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-md text-muted-foreground">{message}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/">
            <House /> Home
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => location.reload()}>
          <RotateCw /> Reload
        </Button>
        {canGoBack && (
          <Button variant="ghost" size="sm" onClick={() => history.back()}>
            <ArrowLeft /> Go Back
          </Button>
        )}
      </div>
    </div>
  )
}
