"use client";

import { Component, ReactNode } from "react";
import { Button } from "./button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="mb-4 text-destructive">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2 font-feature-settings-cv01-ss03">
            Something went wrong
          </h3>
          <p className="text-text-secondary mb-6 max-w-md">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button onClick={this.handleRetry} className="btn-linear-primary">
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use
function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Toast notification component
interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

function Toast({ message, type = "info", onClose }: ToastProps) {
  const typeClasses = {
    success: "bg-success-emerald/10 border-success-emerald/20 text-success-emerald",
    error: "bg-destructive/10 border-destructive/20 text-destructive",
    info: "bg-brand-indigo/10 border-brand-indigo/20 text-brand-indigo",
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 p-4 rounded-md border ${typeClasses[type]} animate-fade-in-up`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export { ErrorBoundary, withErrorBoundary, Toast };
