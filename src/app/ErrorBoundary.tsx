import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error?: Error;
  info?: ErrorInfo;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
    console.error("[Git Transit] Unhandled render error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="entry-screen">
        <section className="debug-crash" role="alert">
          <h1>Git Transit stopped while rendering.</h1>
          <p>
            Copy this diagnostic block and share it. It does not include repository
            secrets or API tokens.
          </p>
          <pre>
            {JSON.stringify(
              {
                message: this.state.error.message,
                stack: this.state.error.stack,
                componentStack: this.state.info?.componentStack,
                userAgent: navigator.userAgent,
                url: window.location.href,
              },
              null,
              2,
            )}
          </pre>
          <button type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </section>
      </main>
    );
  }
}
