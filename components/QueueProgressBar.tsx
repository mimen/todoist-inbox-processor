'use client'

interface QueueProgressBarProps {
  completed: number
  total: number
  percentage: number
  queueName: string
}

export default function QueueProgressBar({ 
  completed, 
  total, 
  percentage, 
  queueName 
}: QueueProgressBarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {queueName}: {completed} of {total} tasks
        </span>
        <span className="text-sm font-medium text-gray-700">
          {Math.round(percentage)}% complete
        </span>
      </div>
      
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">
          {total - completed} remaining
        </span>
        <span className="text-xs text-gray-500">
          {completed} processed
        </span>
      </div>
    </div>
  )
}