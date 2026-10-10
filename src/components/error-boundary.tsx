import { Component, type ErrorInfo, type ReactNode } from "react"

type Props = {
  /** Shown instead of the children after they crash. */
  fallback: ReactNode
  children: ReactNode
}

/**
 * Without a boundary, one component throwing while rendering makes React remove the whole
 * app, leaving a blank page. This keeps the damage to the part that broke.
 */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
