import { ArrowLeft } from "lucide-react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { useTitle } from "@/hooks/use-title"

export default function NotFound() {
  useTitle("404")
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="font-data text-sm text-muted-foreground tabular-nums">404</p>
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-muted-foreground">There’s nothing here. Maybe it moved, maybe it never existed.</p>
      <Button variant="outline" size="sm" asChild className="mt-2">
        <Link to="/">
          <ArrowLeft /> Back home
        </Link>
      </Button>
    </div>
  )
}
