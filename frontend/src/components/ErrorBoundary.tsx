import React, { Component, ErrorInfo } from 'react';
import { useAPI } from '../services/apiProvider';
import type { APIClient } from '../types/api';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryBase extends Component<Props & { api: APIClient }, State> {
  constructor(props: Props & { api: APIClient }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Add component stack to error for better debugging
    const errorWithStack = new Error(error.message);
    if (errorInfo.componentStack) {
      errorWithStack.stack = errorInfo.componentStack;
    }
    // Report the error
    this.props.api.reportError(errorWithStack).catch(console.error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger m-3" role="alert">
          <h4 className="alert-heading">Something went wrong</h4>
          <p>We've been notified about this issue and will look into it.</p>
          <hr />
          <p className="mb-0">
            <button 
              className="btn btn-outline-danger" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to provide API context
const ErrorBoundary: React.FC<Props> = (props) => {
  const api = useAPI();
  return <ErrorBoundaryBase {...props} api={api} />;
};

export default ErrorBoundary; 