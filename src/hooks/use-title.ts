import { useEffect } from "react"

/** Sets the tab title: "[Lovinoes.de]" on home, "[Status]", "[Projects]", "[404]" elsewhere. */
export function useTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `[${page}]` : "[Lovinoes.de]"
  }, [page])
}
