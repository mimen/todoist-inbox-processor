'use client'

interface ProgressIndicatorProps {
  current: number
  total: number
  progress: number
}

export default function ProgressIndicator({ current, total, progress }: ProgressIndicatorProps) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">
          Progress: {current} of {total}
        </span>
        <span className="text-sm text-gray-600">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-todoist-blue h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}