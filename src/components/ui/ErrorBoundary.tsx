import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Render error:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return (
      <div style={{
        padding: 32,
        maxWidth: 640,
        margin: "60px auto",
        fontFamily: "monospace",
        background: "var(--app-surface, #fff)",
        border: "1px solid #f87171",
        borderRadius: 8,
      }}>
        <h2 style={{ color: "#dc2626", marginBottom: 8 }}>Render Error</h2>
        <p style={{ color: "#64748b", marginBottom: 16, fontSize: 13 }}>
          A component threw during render. Check the browser console for the full stack trace.
        </p>
        <pre style={{
          background: "#fee2e2",
          padding: 12,
          borderRadius: 4,
          fontSize: 12,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: "#991b1b",
          marginBottom: 16,
        }}>
          {error.message}
          {"\n\n"}
          {error.stack}
        </pre>
        <button
          type="button"
          onClick={this.reset}
          style={{
            padding: "6px 16px",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
