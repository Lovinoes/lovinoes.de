import { useEffect, useState } from "react"

/** Current time, re-rendered every `interval` ms. For "x ago" labels and timers. */
export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval])
  return now
}
