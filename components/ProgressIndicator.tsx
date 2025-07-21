'use client'

interface ProgressIndicatorProps {
  current: number
  total: number
  progress: number
}

export default function ProgressIndicator({ current, total, progress }: ProgressIndicatorProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Task {current} of {total}
        </span>
        <span className="text-sm font-medium text-gray-700">
          {Math.round(progress)}% complete
        </span>
      </div>
      
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">
          {total - current + 1} remaining
        </span>
        <span className="text-xs text-gray-500">
          {current - 1} completed
        </span>
      </div>
    </div>
  )
}