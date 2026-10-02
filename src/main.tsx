import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import App from "@/App"
import { restrictContextMenu } from "@/lib/context-menu"
import "./index.css"

// The old site routed with #home / #status. Keep those links working.
const legacy: Record<string, string> = { "#home": "/", "#status": "/status" }
if (legacy[location.hash]) history.replaceState(null, "", legacy[location.hash])
window.addEventListener("hashchange", () => {
  if (!legacy[location.hash]) return
  history.replaceState(null, "", legacy[location.hash])
  window.dispatchEvent(new PopStateEvent("popstate")) // let the router pick up the new path
})

restrictContextMenu()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TooltipProvider delayDuration={150}>
        <App />
      </TooltipProvider>
    </BrowserRouter>
  </StrictMode>
)
