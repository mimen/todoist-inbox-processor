'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { TodoistTask, TodoistProject, TodoistLabel } from '@/lib/types'

interface TaskCardProps {
  task: TodoistTask
  projects: TodoistProject[]
  labels: TodoistLabel[]
  onContentChange?: (newContent: string) => void
}

export default function TaskCard({ task, projects, labels, onContentChange }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(task.content)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset edit content when task changes
  useEffect(() => {
    setEditContent(task.content)
    setIsEditing(false)
  }, [task.id, task.content])

  // Auto-save with debounce
  const debouncedSave = useCallback((content: string) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    
    const timeout = setTimeout(() => {
      if (content !== task.content && onContentChange) {
        onContentChange(content)
      }
    }, 2000)
    
    setSaveTimeout(timeout)
  }, [saveTimeout, task.content, onContentChange])

  const handleEditClick = () => {
    setIsEditing(true)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.select()
      }
    }, 0)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setEditContent(newContent)
    debouncedSave(newContent)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      setIsEditing(false)
    }
    if (e.key === 'Escape') {
      setEditContent(task.content)
      setIsEditing(false)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getTodoistColor = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      'berry_red': '#b8256f',
      'red': '#db4035',
      'orange': '#ff9933',
      'yellow': '#fad000',
      'olive_green': '#afb83b',
      'lime_green': '#7ecc49',
      'green': '#299438',
      'mint_green': '#6accbc',
      'teal': '#158fad',
      'sky_blue': '#14aaf5',
      'light_blue': '#96c3eb',
      'blue': '#4073ff',
      'grape': '#884dff',
      'violet': '#af38eb',
      'lavender': '#eb96eb',
      'magenta': '#e05194',
      'salmon': '#ff8d85',
      'charcoal': '#808080',
      'grey': '#b8b8b8',
      'taupe': '#ccac93'
    }
    return colorMap[colorName] || '#299fe6'
  }

  // Convert API priority (1-4) to UI priority (P4-P1)
  const getUIPriority = (apiPriority: number) => {
    return 5 - apiPriority // 4→P1, 3→P2, 2→P3, 1→P4
  }

  const getPriorityColor = (apiPriority: number) => {
    const uiPriority = getUIPriority(apiPriority)
    switch (uiPriority) {
      case 1: return 'text-red-600 bg-red-50 border-red-200'    // P1 = Urgent
      case 2: return 'text-orange-600 bg-orange-50 border-orange-200' // P2 = High
      case 3: return 'text-blue-600 bg-blue-50 border-blue-200'  // P3 = Medium
      default: return 'text-gray-600 bg-gray-50 border-gray-200' // P4 = Normal
    }
  }

  const getPriorityLabel = (apiPriority: number) => {
    const uiPriority = getUIPriority(apiPriority)
    switch (uiPriority) {
      case 1: return 'Urgent'  // P1
      case 2: return 'High'    // P2
      case 3: return 'Medium'  // P3
      default: return 'Normal' // P4
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 task-card-enter">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getPriorityColor(task.priority)}`}>
              P{getUIPriority(task.priority)} • {getPriorityLabel(task.priority)}
            </span>
          </div>
          
          {/* Editable Task Content */}
          <div className="group relative">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="w-full text-xl font-semibold text-gray-900 leading-tight bg-transparent border border-todoist-blue rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-todoist-blue resize-none"
                style={{ minHeight: '2.5rem' }}
              />
            ) : (
              <h2 
                className="text-xl font-semibold text-gray-900 leading-tight cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1 group-hover:bg-gray-50 transition-colors"
                onClick={handleEditClick}
                title="Click to edit task content"
              >
                {task.content}
                <span className="ml-2 opacity-0 group-hover:opacity-50 text-sm text-gray-400">✏️</span>
              </h2>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
          <p className="text-gray-600 bg-gray-50 rounded-md p-3 text-sm leading-relaxed">
            {task.description}
          </p>
        </div>
      )}

      {/* Current Assignment */}
      <div className="space-y-3 mb-6">
        <div>
          <span className="text-sm font-medium text-gray-700">Project:</span>
          <div className="ml-2 inline-flex items-center space-x-2 bg-gray-100 px-2 py-1 rounded">
            {(() => {
              const project = projects.find(p => p.id === task.projectId)
              const projectColor = project ? getTodoistColor(project.color) : '#299fe6'
              return (
                <>
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: projectColor }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {project?.name || 'Unknown Project'}
                  </span>
                </>
              )
            })()}
          </div>
        </div>

        {task.labels.length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-700">Labels:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {task.labels.map((labelName) => {
                const label = labels.find(l => l.name === labelName)
                const labelColor = label ? getTodoistColor(label.color) : '#299fe6'
                return (
                  <span
                    key={labelName}
                    className="text-xs px-2 py-1 rounded flex items-center space-x-1"
                    style={{ backgroundColor: `${labelColor}20`, color: labelColor }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: labelColor }}
                    ></div>
                    <span>{labelName}</span>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {task.due && (
          <div>
            <span className="text-sm font-medium text-gray-700">Due:</span>
            <span className="ml-2 text-sm text-gray-600">
              {formatDate(task.due.date)}
            </span>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created: {formatDate(task.createdAt)}</span>
          <span>ID: {task.id}</span>
        </div>
      </div>
    </div>
  )
}