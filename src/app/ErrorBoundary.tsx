import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application rendering failed.", error, errorInfo.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page-wrap detail-state" aria-live="assertive">
          <p className="eyebrow">Something went wrong</p>
          <h1>We hit a small snag.</h1>
          <p>The application couldn't render this page.</p>
          <button
            className="button button-outline"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload the page
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
