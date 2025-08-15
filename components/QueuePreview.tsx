'use client'

import { TodoistTask } from '@/lib/types'

interface QueuePreviewProps {
  tasks: TodoistTask[]
}

export default function QueuePreview({ tasks }: QueuePreviewProps) {
  const displayTasks = tasks.slice(0, 10)
  
  return (
    <div className="space-y-2">
      {displayTasks.map((task, index) => {
        // Calculate opacity - fade out from task 5 to task 10
        const opacity = index < 5 ? 1 : 1 - ((index - 4) * 0.2)
        
        return (
          <div 
            key={task.id} 
            className="text-sm text-gray-600 truncate"
            style={{ opacity }}
          >
            {index + 1}. {task.content}
          </div>
        )
      })}
      {tasks.length > 10 && (
        <div className="text-sm text-gray-400" style={{ opacity: 0.3 }}>
          + {tasks.length - 10} more...
        </div>
      )}
    </div>
  )
}