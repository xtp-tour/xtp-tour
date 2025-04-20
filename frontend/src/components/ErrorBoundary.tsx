import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Something went wrong</h4>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <hr />
          <p className="mb-0">
            Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 