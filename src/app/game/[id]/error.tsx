'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Game Page Error]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Game Data Unavailable</h2>
          <p className="text-gray-400 text-sm">
            We couldn&apos;t load this game. The game may not exist yet, or the data source is temporarily unavailable.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 font-bold text-sm hover:bg-green-500/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link
            href="/scores"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-gray-300 font-bold text-sm hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Scores
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-600">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
