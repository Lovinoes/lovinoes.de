import type { ComponentType, ReactNode } from "react"
import { ArrowRight, ExternalLink } from "lucide-react"
import { Link } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type StatCardProps = {
  title: string
  icon: ComponentType<{ className?: string }>
  value: ReactNode
  sub: ReactNode
  href: string
  /** Internal routes use the router; anything else opens in a new tab. */
  internal?: boolean
  loading?: boolean
}

export function StatCard({ title, icon: Icon, value, sub, href, internal, loading }: StatCardProps) {
  const HoverIcon = internal ? ArrowRight : ExternalLink
  const body = (
    <Card className="relative h-full overflow-hidden transition-shadow group-hover:ring-foreground/20 group-focus-visible:ring-ring">
      <CardHeader className="flex flex-row items-center justify-between pb-1 transition-opacity duration-200 group-hover:opacity-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="transition-opacity duration-200 group-hover:opacity-10">
        {loading ? (
          <>
            <Skeleton className="mb-1.5 h-7 w-16" />
            <Skeleton className="h-3.5 w-24" />
          </>
        ) : (
          <>
            <p className="truncate text-2xl font-bold">{value}</p>
            <p className="truncate text-xs text-muted-foreground">{sub}</p>
          </>
        )}
      </CardContent>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <HoverIcon className="size-5 text-foreground" aria-hidden="true" />
      </div>
    </Card>
  )

  const cls = "group rounded-xl outline-none"
  return internal ? (
    <Link to={href} className={cls}>
      {body}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  )
}
