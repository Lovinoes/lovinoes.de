import { useEffect } from "react"
import { RotateCw } from "lucide-react"
import { Route, Routes, useLocation } from "react-router"
import { ErrorBoundary } from "@/components/error-boundary"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { serverError } from "@/lib/errors"
import ErrorPage from "@/pages/error"
import Home from "@/pages/home"
import Projects from "@/pages/projects"
import Status from "@/pages/status"

function Crashed() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Something broke</h1>
      <p className="max-w-md text-muted-foreground">This page ran into an error. Reloading usually fixes it.</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={() => location.reload()}>
        <RotateCw /> Reload
      </Button>
    </div>
  )
}

export default function App() {
  const { pathname } = useLocation()
  // nginx answered this URL with an error (403, 502, ...): show it there. Navigating
  // elsewhere in the app works normally.
  const errorCode = serverError && pathname === serverError.path ? serverError.code : null

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
        {/* keyed by path so the entrance animation replays on every page switch */}
        <div
          key={pathname}
          className="flex flex-1 flex-col duration-700 ease-out animate-in fade-in slide-in-from-bottom-5 motion-reduce:animate-none"
        >
          {/* inside the keyed div, so the boundary resets when you go to another page */}
          <ErrorBoundary fallback={<Crashed />}>
            {errorCode ? (
              <ErrorPage code={errorCode} />
            ) : (
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/status" element={<Status />} />
                <Route path="*" element={<ErrorPage code={404} />} />
              </Routes>
            )}
          </ErrorBoundary>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
