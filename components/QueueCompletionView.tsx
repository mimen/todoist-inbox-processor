import React from 'react'

interface QueueCompletionViewProps {
  isEmptyQueue: boolean
  hasNextQueue: boolean
  nextQueueLabel?: string
  nextQueueCount?: number
  queueProgress?: {
    current: number
    total: number
  }
  onContinue: () => void
  onRefresh: () => void
}

export default function QueueCompletionView({
  isEmptyQueue,
  hasNextQueue,
  nextQueueLabel,
  nextQueueCount,
  queueProgress,
  onContinue,
  onRefresh
}: QueueCompletionViewProps) {
  if (hasNextQueue) {
    return (
      <div className="space-y-4">
        {!isEmptyQueue && (
          <p className="text-green-600 font-medium">
            🎉 Queue completed!
          </p>
        )}
        {isEmptyQueue && (
          <p className="text-gray-600">
            No tasks in this queue.
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            Continue to {nextQueueLabel || 'Next Queue'}
            {nextQueueCount !== undefined && nextQueueCount > 0 && (
              <span className="text-green-200">({nextQueueCount} tasks)</span>
            )}
            <div className="flex items-center gap-1 ml-2">
              <kbd className="px-1.5 py-0.5 text-xs bg-green-700 rounded">→</kbd>
              <kbd className="px-1.5 py-0.5 text-xs bg-green-700 rounded">↵</kbd>
            </div>
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-gray-700 border border-gray-300 bg-white rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            Refresh
            <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 rounded">R</kbd>
          </button>
        </div>
        {queueProgress && (
          <p className="text-xs text-gray-500">
            Queue {queueProgress.current} of {queueProgress.total} completed
          </p>
        )}
      </div>
    )
  }

  // Last queue or no next queue
  return (
    <div className="space-y-2">
      {!isEmptyQueue && (
        <p className="text-green-600 font-medium mb-4">
          🏁 Last queue completed!
        </p>
      )}
      {isEmptyQueue && (
        <p className="text-gray-600">
          No tasks in this queue.
        </p>
      )}
      <button
        onClick={onRefresh}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        Refresh Tasks
        <kbd className="px-1.5 py-0.5 text-xs bg-blue-700 rounded">R</kbd>
      </button>
    </div>
  )
}