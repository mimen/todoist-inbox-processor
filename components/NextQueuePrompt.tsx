import React, { useEffect } from 'react'
import { CheckCircle, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DropdownOption } from '@/types/dropdown'
import OptionIcon from './OptionIcon'

interface NextQueuePromptProps {
  currentQueue: DropdownOption | null
  nextQueue: DropdownOption | null
  onContinue: () => void
  onDismiss: () => void
  isVisible: boolean
}

export function NextQueuePrompt({
  currentQueue,
  nextQueue,
  onContinue,
  onDismiss,
  isVisible
}: NextQueuePromptProps) {
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        onContinue()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onDismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, onContinue, onDismiss])

  if (!isVisible || !nextQueue) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Queue Completed!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentQueue ? `All tasks in "${currentQueue.label}" have been processed` : 'Current queue completed'}
            </p>
          </div>
        </div>

        <div className="border-t dark:border-gray-700 pt-4 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Continue to the next queue:
          </p>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <OptionIcon option={nextQueue} />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {nextQueue.label}
              </p>
              {nextQueue.count !== undefined && nextQueue.count > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {nextQueue.count} {nextQueue.count === 1 ? 'task' : 'tasks'} remaining
                </p>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">→</kbd>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onContinue}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2",
              "bg-blue-500 hover:bg-blue-600 text-white rounded-lg",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            )}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onDismiss}
            className={cn(
              "px-4 py-2",
              "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600",
              "text-gray-700 dark:text-gray-200 rounded-lg",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">→</kbd> to continue or{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Esc</kbd> to dismiss
        </p>
      </div>
    </div>
  )
}