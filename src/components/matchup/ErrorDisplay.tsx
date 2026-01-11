'use client'

import { AlertTriangle, RefreshCw, WifiOff, ServerCrash } from 'lucide-react'
import Link from 'next/link'

interface ErrorDisplayProps {
  error?: Error | null
  title?: string
  message?: string
  onRetry?: () => void
  showRetry?: boolean
  backLink?: string
  backText?: string
  variant?: 'full' | 'inline' | 'card'
}

export default function ErrorDisplay({ 
  error, 
  title = 'Something went wrong',
  message,
  onRetry,
  showRetry = true,
  backLink,
  backText = 'Go back',
  variant = 'inline'
}: ErrorDisplayProps) {
  // Determine error type for appropriate icon/message
  const isNetworkError = error?.message?.toLowerCase().includes('network') || 
                         error?.message?.toLowerCase().includes('fetch')
  const isNotFound = error?.message?.toLowerCase().includes('not found')
  
  const getIcon = () => {
    if (isNetworkError) return <WifiOff className="w-8 h-8 text-red-400" />
    if (isNotFound) return <AlertTriangle className="w-8 h-8 text-amber-400" />
    return <ServerCrash className="w-8 h-8 text-red-400" />
  }
  
  const getMessage = () => {
    if (message) return message
    if (isNetworkError) return 'Unable to connect. Please check your internet connection.'
    if (isNotFound) return 'The requested resource could not be found.'
    return error?.message || 'An unexpected error occurred. Please try again.'
  }

  if (variant === 'full') {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-6 p-4">
        {getIcon()}
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-gray-400 text-center max-w-md">{getMessage()}</p>
        <div className="flex items-center gap-4">
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          {backLink && (
            <Link 
              href={backLink}
              className="text-orange-400 hover:text-orange-300 transition-colors"
            >
              ← {backText}
            </Link>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          {getIcon()}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
            <p className="text-gray-400 text-sm mb-4">{getMessage()}</p>
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Inline variant
  return (
    <div className="flex items-center justify-center gap-3 p-4 text-center">
      <AlertTriangle className="w-5 h-5 text-red-400" />
      <span className="text-gray-400">{getMessage()}</span>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  )
}

// Specific error components for common cases
export function GameNotFound({ sport, backLink }: { sport: string; backLink: string }) {
  return (
    <ErrorDisplay
      variant="full"
      title="Game Not Found"
      message={`This ${sport.toUpperCase()} game couldn't be found. It may have been rescheduled or cancelled.`}
      backLink={backLink}
      backText={`Back to ${sport.toUpperCase()} matchups`}
      showRetry={false}
    />
  )
}

export function DataLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorDisplay
      variant="card"
      title="Failed to Load Data"
      message="We couldn't load the data for this section. Please try again."
      onRetry={onRetry}
    />
  )
}
