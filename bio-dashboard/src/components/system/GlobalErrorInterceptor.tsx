"use client";

import * as React from "react";
import { captureError } from "@/lib/aiops-engine";

interface Props {
  children: React.ReactNode;
}

/**
 * Global Error Interceptor
 * Captures unhandled errors and sends them to the AIOps engine
 */
export function GlobalErrorInterceptor({ children }: Props) {
  React.useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[AIOps] Unhandled Promise Rejection:", event.reason);
      
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      captureError(error, {
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined
      });
    };

    // Handle global errors
    const handleGlobalError = (event: ErrorEvent) => {
      console.error("[AIOps] Global Error:", event.error);
      
      if (event.error instanceof Error) {
        captureError(event.error, {
          url: event.filename,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined
        });
      }
    };

    // Handle console.error interception
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      // Call original console.error
      originalConsoleError.apply(console, args);
      
      // Check if first arg is an Error
      if (args[0] instanceof Error) {
        captureError(args[0], {
          url: typeof window !== "undefined" ? window.location.href : undefined
        });
      } else if (typeof args[0] === "string" && args[0].toLowerCase().includes("error")) {
        // Create error from string message
        const errorMessage = args.map(arg => String(arg)).join(" ");
        const syntheticError = new Error(errorMessage);
        // Don't capture synthetic errors to avoid noise
        // captureError(syntheticError, { url: window.location.href });
      }
    };

    // Add event listeners
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleGlobalError);

    // Cleanup
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleGlobalError);
      console.error = originalConsoleError;
    };
  }, []);

  return <>{children}</>;
}

/**
 * API Error Wrapper
 * Wraps fetch calls to intercept API errors
 */
export function createErrorInterceptingFetch() {
  const originalFetch = globalThis.fetch;

  return async function interceptedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const startTime = Date.now();
    
    try {
      const response = await originalFetch(input, init);
      
      // Log slow requests
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        console.warn(`[AIOps] Slow API call: ${input} took ${duration}ms`);
      }
      
      // Capture 5xx errors
      if (response.status >= 500) {
        const url = typeof input === "string" ? input : input.toString();
        const error = new Error(`API Error ${response.status}: ${response.statusText} at ${url}`);
        captureError(error, {
          httpMethod: init?.method ?? "GET",
          httpStatus: response.status,
          url
        });
      }
      
      return response;
    } catch (err) {
      // Capture network errors
      const url = typeof input === "string" ? input : input.toString();
      const error = err instanceof Error ? err : new Error(String(err));
      captureError(error, {
        httpMethod: init?.method ?? "GET",
        url
      });
      throw err;
    }
  };
}

/**
 * React Error Boundary with AIOps integration
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AIOpsErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture error with component stack
    const enhancedError = new Error(error.message);
    enhancedError.stack = `${error.stack}\n\nComponent Stack:${errorInfo.componentStack}`;
    
    captureError(enhancedError, {
      url: typeof window !== "undefined" ? window.location.href : undefined
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-rose-500/30 p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-6">
              An error has been automatically reported to our system. 
              The self-healing agent is analyzing the issue.
            </p>
            
            {this.state.error && (
              <div className="text-left bg-slate-950 rounded-lg p-3 mb-6">
                <code className="text-xs text-rose-400 font-mono">
                  {this.state.error.message}
                </code>
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}






