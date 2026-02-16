"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { LabError, LabErrorCode } from '../../types/lab';

// =============================================================
// LabErrorBoundary - Graceful Error Handling for Bio-Lab
// Phase 1 - Production Foundation
// =============================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  labError: LabError | null;
}

export class LabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      labError: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Convert to LabError
    const labError: LabError = {
      code: LabErrorBoundary.mapErrorToCode(error),
      message: error.message || 'An unexpected error occurred',
      details: error.stack,
      timestamp: new Date().toISOString(),
      recoverable: LabErrorBoundary.isRecoverable(error),
    };

    return {
      hasError: true,
      error,
      labError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('LabErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service (e.g., Sentry)
    // This could be extended to send to an actual error tracking service
    this.reportError(error, errorInfo);
  }

  static mapErrorToCode(error: Error): LabErrorCode {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch') || name === 'typeerror') {
      return LabErrorCode.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return LabErrorCode.TIMEOUT;
    }
    if (message.includes('api')) {
      return LabErrorCode.API_UNAVAILABLE;
    }

    // Validation errors
    if (message.includes('pdb') && message.includes('invalid')) {
      return LabErrorCode.INVALID_PDB_ID;
    }
    if (message.includes('sequence') && message.includes('invalid')) {
      return LabErrorCode.INVALID_SEQUENCE;
    }
    if (message.includes('smiles') && message.includes('invalid')) {
      return LabErrorCode.INVALID_SMILES;
    }
    if (message.includes('validation') || message.includes('invalid input')) {
      return LabErrorCode.INVALID_INPUT;
    }

    // Execution errors
    if (message.includes('pyodide') || message.includes('python')) {
      return LabErrorCode.PYODIDE_ERROR;
    }
    if (message.includes('ngl') || message.includes('webgl')) {
      return LabErrorCode.NGL_LOAD_ERROR;
    }
    if (message.includes('execution') || message.includes('runtime')) {
      return LabErrorCode.EXECUTION_FAILED;
    }

    // Auth errors
    if (message.includes('unauthorized') || message.includes('not authenticated')) {
      return LabErrorCode.UNAUTHORIZED;
    }
    if (message.includes('session') && message.includes('expired')) {
      return LabErrorCode.SESSION_EXPIRED;
    }

    // Persistence errors
    if (message.includes('save') || message.includes('insert')) {
      return LabErrorCode.SAVE_FAILED;
    }
    if (message.includes('load') || message.includes('fetch') || message.includes('select')) {
      return LabErrorCode.LOAD_FAILED;
    }

    return LabErrorCode.UNKNOWN;
  }

  static isRecoverable(error: Error): boolean {
    const code = LabErrorBoundary.mapErrorToCode(error);
    
    // Non-recoverable errors
    const nonRecoverableCodes = [
      LabErrorCode.UNAUTHORIZED,
      LabErrorCode.SESSION_EXPIRED,
    ];

    return !nonRecoverableCodes.includes(code);
  }

  private reportError(error: Error, errorInfo: ErrorInfo): void {
    // In production, this would send to an error tracking service
    // For now, we just log it
    const errorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };

    // Store in localStorage for debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('lab_error_log') || '[]');
      errorLog.push(errorReport);
      // Keep only last 10 errors
      if (errorLog.length > 10) {
        errorLog.shift();
      }
      localStorage.setItem('lab_error_log', JSON.stringify(errorLog));
    } catch {
      // Ignore storage errors
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      labError: null,
    });
    this.props.onRetry?.();
  };

  handleGoHome = (): void => {
    window.location.href = '/lab';
  };

  render(): ReactNode {
    const { hasError, error, labError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI with Liquid Glass styling
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="lab-panel p-8 rounded-2xl max-w-lg w-full text-center">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-semibold text-red-500 mb-2">
              {labError?.recoverable ? 'Something went wrong' : 'Session Error'}
            </h2>

            {/* Error Code */}
            {labError && (
              <div className="inline-block px-2 py-1 bg-red-500/10 rounded text-xs font-mono text-red-400 mb-4">
                {labError.code}
              </div>
            )}

            {/* Error Message */}
            <p className="text-sm text-muted-foreground mb-6">
              {labError?.message || error?.message || 'An unexpected error occurred'}
            </p>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              {labError?.recoverable && (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              )}
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-muted/50 hover:bg-muted text-foreground rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return to Lab
              </button>
            </div>

            {/* Technical Details (collapsible) */}
            {process.env.NODE_ENV === 'development' && error?.stack && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Bug className="w-3 h-3" />
                  Technical Details
                </summary>
                <pre className="mt-2 p-3 bg-muted/30 rounded-lg overflow-x-auto text-xs font-mono text-muted-foreground">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

// =============================================================
// Hook for Error Handling
// =============================================================

export function useLabErrorHandler() {
  const handleError = (error: Error, context?: string): LabError => {
    const labError: LabError = {
      code: LabErrorBoundary.mapErrorToCode(error),
      message: error.message,
      details: { context, stack: error.stack },
      timestamp: new Date().toISOString(),
      recoverable: LabErrorBoundary.isRecoverable(error),
    };

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Lab Error${context ? ` - ${context}` : ''}]`, error);
    }

    return labError;
  };

  const createError = (code: LabErrorCode, message: string, recoverable = true): LabError => {
    return {
      code,
      message,
      timestamp: new Date().toISOString(),
      recoverable,
    };
  };

  return { handleError, createError };
}

// =============================================================
// Utility Functions
// =============================================================

export function isLabError(error: unknown): error is LabError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error &&
    'recoverable' in error
  );
}

export function getErrorMessage(error: unknown): string {
  if (isLabError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function getErrorRecoveryAction(error: LabError): string | null {
  switch (error.code) {
    case LabErrorCode.NETWORK_ERROR:
    case LabErrorCode.API_UNAVAILABLE:
      return 'Check your internet connection and try again.';
    case LabErrorCode.TIMEOUT:
      return 'The operation took too long. Try again with a smaller dataset.';
    case LabErrorCode.INVALID_PDB_ID:
      return 'Please enter a valid 4-character PDB ID (e.g., 4HHB).';
    case LabErrorCode.INVALID_SEQUENCE:
      return 'Please enter a valid amino acid sequence.';
    case LabErrorCode.INVALID_SMILES:
      return 'Please enter a valid SMILES string.';
    case LabErrorCode.UNAUTHORIZED:
    case LabErrorCode.SESSION_EXPIRED:
      return 'Please sign in to continue.';
    case LabErrorCode.PYODIDE_ERROR:
      return 'The Python environment failed to load. Refresh the page.';
    case LabErrorCode.NGL_LOAD_ERROR:
      return 'The 3D viewer failed to load. Check WebGL support.';
    default:
      return null;
  }
}
