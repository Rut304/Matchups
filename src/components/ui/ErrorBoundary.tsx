'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
    
    // In production, log to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Log to Sentry, LogRocket, etc.
      console.error('[Production Error]', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8" style={{ background: '#050508' }}>
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                 style={{ background: 'rgba(255,68,85,0.2)' }}>
              <AlertTriangle className="w-8 h-8" style={{ color: '#FF4455' }} />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm mb-6" style={{ color: '#808090' }}>
              We encountered an error loading this section. This has been automatically reported.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}>
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <Link href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
                style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.3)' }}>
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm" style={{ color: '#808090' }}>
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 p-4 rounded-xl text-xs overflow-auto"
                     style={{ background: 'rgba(255,68,85,0.1)', color: '#FF4455' }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Data Loading Error Component
export function DataError({ 
  message = 'Failed to load data',
  onRetry,
  showRetry = true 
}: { 
  message?: string
  onRetry?: () => void
  showRetry?: boolean
}) {
  return (
    <div className="p-6 rounded-2xl text-center"
         style={{ background: 'rgba(255,68,85,0.05)', border: '1px solid rgba(255,68,85,0.2)' }}>
      <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color: '#FF4455' }} />
      <p className="font-medium text-white mb-1">Unable to Load</p>
      <p className="text-sm mb-4" style={{ color: '#808090' }}>{message}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF' }}>
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  )
}

// No Data Available Component
export function NoDataAvailable({ 
  title = 'Data Not Available',
  message = 'We don\'t have data for this section yet.',
  icon = AlertTriangle 
}: { 
  title?: string
  message?: string
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}) {
  const Icon = icon
  return (
    <div className="p-8 rounded-2xl text-center"
         style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <Icon className="w-10 h-10 mx-auto mb-3" style={{ color: '#808090' }} />
      <p className="font-medium text-white mb-1">{title}</p>
      <p className="text-sm" style={{ color: '#606070' }}>{message}</p>
    </div>
  )
}

// Loading Skeleton
export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded" 
             style={{ 
               background: 'rgba(255,255,255,0.05)', 
               width: `${100 - (i * 15)}%` 
             }} />
      ))}
    </div>
  )
}

// Service Unavailable Component
export function ServiceUnavailable({ 
  serviceName,
  retryIn,
  onRetry 
}: { 
  serviceName: string
  retryIn?: number
  onRetry?: () => void
}) {
  return (
    <div className="p-6 rounded-2xl"
         style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: 'rgba(255,215,0,0.2)' }}>
          <AlertTriangle className="w-5 h-5" style={{ color: '#FFD700' }} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-white">{serviceName} Temporarily Unavailable</p>
          <p className="text-sm mt-1" style={{ color: '#808090' }}>
            We're experiencing issues connecting to this service. 
            {retryIn ? ` Retrying in ${retryIn} seconds...` : ' Please try again later.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium transition-colors"
              style={{ color: '#FFD700' }}>
              Retry Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
