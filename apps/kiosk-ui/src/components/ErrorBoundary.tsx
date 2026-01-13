/**
 * Error Boundary - Catch React errors gracefully
 * WCAG compliant with accessible error messages
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({ errorInfo });

        // In production, send to error tracking service
        if (import.meta.env.PROD) {
            // e.g., Sentry.captureException(error);
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div
                    className="min-h-screen bg-kiosk-bg flex items-center justify-center p-8"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="card-kiosk max-w-lg text-center">
                        {/* Error Icon */}
                        <div
                            className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                            aria-hidden="true"
                        >
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>

                        {/* Error Message */}
                        <h1 className="text-kiosk-2xl font-bold text-red-400 mb-2">
                            Something Went Wrong
                        </h1>
                        <p className="text-kiosk-muted mb-6">
                            We encountered an unexpected error. Please try again or return to the home screen.
                        </p>

                        {/* Error Details (dev only) */}
                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-kiosk-sm text-kiosk-muted cursor-pointer hover:text-white">
                                    Show Error Details
                                </summary>
                                <pre className="mt-2 p-4 bg-slate-900 rounded-lg text-xs text-red-300 overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={this.handleRetry}
                                className="btn-primary flex-1"
                                aria-label="Try again to reload this page"
                            >
                                <RefreshCw className="w-5 h-5" aria-hidden="true" />
                                Try Again
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="btn-outline flex-1"
                                aria-label="Go back to home screen"
                            >
                                <Home className="w-5 h-5" aria-hidden="true" />
                                Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
