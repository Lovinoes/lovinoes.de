import { useEffect } from "react"

/** Sets the tab title: "[Lovinoes.de]" or "[Lovinoes.de] Status". */
export function useTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `[Lovinoes.de] ${page}` : "[Lovinoes.de]"
  }, [page])
}
