import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 max-w-2xl mx-auto mt-10 bg-destructive/10 border border-destructive rounded-lg">
                    <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
                    <p className="mb-4">The application crashed. Here is the error:</p>
                    <pre className="bg-black/80 text-white p-4 rounded overflow-auto text-sm mb-4">
                        {this.state.error?.toString()}
                    </pre>
                    <details className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                        {this.state.errorInfo?.componentStack}
                    </details>
                    <button
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
