'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { TodoistTask, TodoistProject, TodoistLabel } from '@/lib/types'

interface TaskCardProps {
  task: TodoistTask
  projects: TodoistProject[]
  labels: TodoistLabel[]
  onContentChange?: (newContent: string) => void
  onDescriptionChange?: (newDescription: string) => void
  onProjectClick?: () => void
  onPriorityClick?: () => void
  onLabelAdd?: () => void
  onLabelRemove?: (labelName: string) => void
  onScheduledClick?: () => void
  onDeadlineClick?: () => void
}

export default function TaskCard({ 
  task, 
  projects, 
  labels, 
  onContentChange, 
  onDescriptionChange,
  onProjectClick,
  onPriorityClick,
  onLabelAdd,
  onLabelRemove,
  onScheduledClick,
  onDeadlineClick 
}: TaskCardProps) {
  const [content, setContent] = useState(task.content)
  const [description, setDescription] = useState(task.description || '')
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  // Update local state when task changes
  useEffect(() => {
    setContent(task.content)
    setDescription(task.description || '')
  }, [task.id, task.content, task.description])

  // Auto-save with debounce
  const debouncedSave = useCallback((type: 'content' | 'description', value: string) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    
    const timeout = setTimeout(() => {
      if (type === 'content' && value !== task.content && onContentChange) {
        onContentChange(value)
      } else if (type === 'description' && value !== (task.description || '') && onDescriptionChange) {
        onDescriptionChange(value)
      }
    }, 1000)
    
    setSaveTimeout(timeout)
  }, [saveTimeout, task.content, task.description, onContentChange, onDescriptionChange])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    debouncedSave('content', newContent)
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value
    setDescription(newDescription)
    debouncedSave('description', newDescription)
  }

  // Auto-resize textarea
  useEffect(() => {
    const adjustHeight = (textarea: HTMLTextAreaElement | null) => {
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }
    adjustHeight(contentRef.current)
    adjustHeight(descriptionRef.current)
  }, [content, description])
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateString)
      return 'Invalid date'
    }
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
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <button
              onClick={onPriorityClick}
              className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors hover:opacity-80 cursor-pointer ${getPriorityColor(task.priority)}`}
              title="Click to change priority"
            >
              P{getUIPriority(task.priority)} • {getPriorityLabel(task.priority)}
            </button>
            <button
              onClick={onProjectClick}
              className="inline-flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs transition-colors cursor-pointer"
              title="Click to change project"
            >
              {(() => {
                const project = projects.find(p => p.id === task.projectId)
                const projectColor = project ? getTodoistColor(project.color) : '#299fe6'
                return (
                  <>
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: projectColor }}
                    ></div>
                    <span className="text-gray-700">
                      {project?.name || 'Unknown Project'}
                    </span>
                  </>
                )
              })()}
            </button>
            
            {/* Scheduled Date */}
            {task.due ? (
              <button
                onClick={onScheduledClick}
                className="inline-flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs transition-colors cursor-pointer border border-blue-200"
                title="Click to change scheduled date"
              >
                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-blue-700">
                  {task.due.string || formatDate(task.due.date)}
                </span>
              </button>
            ) : (
              <button
                onClick={onScheduledClick}
                className="inline-flex items-center space-x-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs transition-colors"
                title="Add scheduled date"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Schedule</span>
              </button>
            )}
            
            {/* Deadline */}
            {task.deadline ? (
              <button
                onClick={onDeadlineClick}
                className="inline-flex items-center space-x-2 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs transition-colors cursor-pointer border border-red-200"
                title="Click to change deadline"
              >
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700">
                  {task.deadline.string || formatDate(task.deadline.date)}
                </span>
              </button>
            ) : (
              <button
                onClick={onDeadlineClick}
                className="inline-flex items-center space-x-2 text-gray-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs transition-colors"
                title="Add deadline"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Deadline</span>
              </button>
            )}
          </div>
          
          {/* Always-Editable Task Content */}
          <textarea
            ref={contentRef}
            value={content}
            onChange={handleContentChange}
            className="w-full text-xl font-semibold text-gray-900 leading-tight bg-transparent hover:bg-gray-50 rounded-md px-2 py-1 focus:outline-none focus:bg-white focus:ring-2 focus:ring-todoist-blue resize-none transition-all overflow-hidden"
            style={{ minHeight: '2rem' }}
            placeholder="Task name..."
          />
        </div>
      </div>

      {/* Always-Editable Description */}
      <div className="mb-4">
        <textarea
          ref={descriptionRef}
          value={description}
          onChange={handleDescriptionChange}
          className="w-full text-gray-600 bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-md p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-todoist-blue resize-none transition-all overflow-hidden"
          placeholder="Add a description..."
          style={{ minHeight: '3rem' }}
        />
      </div>

      {/* Current Assignment */}
      <div className="space-y-3 mb-6">
        <div>
          <span className="text-sm font-medium text-gray-700">Labels:</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {task.labels.map((labelName) => {
              const label = labels.find(l => l.name === labelName)
              const labelColor = label ? getTodoistColor(label.color) : '#299fe6'
              return (
                <div
                  key={labelName}
                  className="text-xs px-2 py-1 rounded-full flex items-center group relative transition-all"
                  style={{ backgroundColor: `${labelColor}20`, color: labelColor }}
                >
                  <div className="flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0 mr-1 group-hover:hidden"
                      style={{ backgroundColor: labelColor }}
                    ></div>
                    <button
                      onClick={() => onLabelRemove?.(labelName)}
                      className="w-2 h-2 mr-1 rounded-full items-center justify-center hidden group-hover:flex hover:scale-125 transition-transform"
                      title="Remove label"
                    >
                      <span className="text-xs font-bold leading-none">×</span>
                    </button>
                    <span>{labelName}</span>
                  </div>
                </div>
              )
            })}
            <button
              onClick={onLabelAdd}
              className="text-xs px-2 py-1 rounded-full flex items-center transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
              title="Add labels"
            >
              <span className="font-medium">+ Add Label</span>
            </button>
          </div>
        </div>
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