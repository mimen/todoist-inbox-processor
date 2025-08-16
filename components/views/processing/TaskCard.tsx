'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { TodoistTask, TodoistProject, TodoistLabel, TodoistUser } from '@/lib/types'
import { isExcludedLabel } from '@/lib/excluded-labels'
import { getDateColor, getDateTimeLabel, getFullDateTime } from '@/lib/date-colors'
import { parseTodoistLinks } from '@/lib/todoist-link-parser'

interface TaskCardProps {
  task: TodoistTask
  projects: TodoistProject[]
  labels: TodoistLabel[]
  assignee?: TodoistUser
  hasCollaborators?: boolean
  dateLoadingState?: 'due' | 'deadline' | null
  isNew?: boolean
  onContentChange?: (newContent: string) => void
  onDescriptionChange?: (newDescription: string) => void
  onProjectClick?: () => void
  onPriorityClick?: () => void
  onLabelAdd?: () => void
  onLabelRemove?: (labelName: string) => void
  onScheduledClick?: () => void
  onDeadlineClick?: () => void
  onAssigneeClick?: () => void
}

export default function TaskCard({ 
  task, 
  projects, 
  labels, 
  assignee,
  hasCollaborators = false,
  dateLoadingState = null,
  isNew = false,
  onContentChange, 
  onDescriptionChange,
  onProjectClick,
  onPriorityClick,
  onLabelAdd,
  onLabelRemove,
  onScheduledClick,
  onDeadlineClick,
  onAssigneeClick 
}: TaskCardProps) {
  const [content, setContent] = useState(task.content)
  const [description, setDescription] = useState(task.description || '')
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [isEditingContent, setIsEditingContent] = useState(isNew)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const searchParams = useSearchParams()
  const isDebugMode = searchParams.get('debug') === 'true'

  // Update local state when task changes
  useEffect(() => {
    setContent(task.content)
    setDescription(task.description || '')
  }, [task.id, task.content, task.description])

  // Auto-focus content when isNew
  useEffect(() => {
    if (isNew && isEditingContent && contentRef.current) {
      contentRef.current.focus()
      contentRef.current.select()
    }
  }, [isNew, isEditingContent])

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

  const handleContentSubmit = useCallback(() => {
    if (content.trim() && content !== task.content) {
      onContentChange?.(content.trim())
    }
    setIsEditingContent(false)
  }, [content, task.content, onContentChange])

  const handleDescriptionSubmit = useCallback(() => {
    if (description !== (task.description || '')) {
      onDescriptionChange?.(description)
    }
    setIsEditingDescription(false)
  }, [description, task.description, onDescriptionChange])

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleContentSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setContent(task.content)
      setIsEditingContent(false)
    }
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setDescription(task.description || '')
      setIsEditingDescription(false)
    }
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

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditingContent && contentRef.current) {
      contentRef.current.focus()
      contentRef.current.select()
    }
  }, [isEditingContent])

  useEffect(() => {
    if (isEditingDescription && descriptionRef.current) {
      descriptionRef.current.focus()
    }
  }, [isEditingDescription])

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
    <div className="bg-white rounded-lg border border-gray-200 task-card-enter relative">
      {/* Main Content Area */}
      <div className="p-4 pb-2">
        {/* Task Content */}
        <div className="mb-1">
          {isEditingContent ? (
            <textarea
              ref={contentRef}
              value={content}
              onChange={handleContentChange}
              onBlur={handleContentSubmit}
              onKeyDown={handleContentKeyDown}
              className="w-full text-xl font-semibold text-gray-900 leading-tight bg-transparent hover:bg-gray-50 rounded px-2 py-1 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none transition-all overflow-hidden"
              style={{ minHeight: '1.75rem' }}
              placeholder="Task name..."
            />
          ) : (
            // View mode - parse and render links
            <div 
              className="w-full text-xl font-semibold text-gray-900 leading-tight px-2 py-1 hover:bg-gray-50 rounded cursor-text"
              onDoubleClick={() => setIsEditingContent(true)}
              style={{ minHeight: '1.75rem' }}
              title="Double-click to edit"
            >
              {parseTodoistLinks(content).map((segment, index) => {
                if (segment.type === 'text') {
                  return <span key={index}>{segment.content}</span>
                } else {
                  return (
                    <a
                      key={index}
                      href={segment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {segment.content}
                    </a>
                  )
                }
              })}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          {isEditingDescription ? (
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={handleDescriptionChange}
              onBlur={handleDescriptionSubmit}
              onKeyDown={handleDescriptionKeyDown}
              className="w-full text-gray-600 bg-gray-50 hover:bg-gray-100 focus:bg-white rounded p-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all overflow-hidden"
              placeholder="Add a description..."
              style={{ minHeight: '2rem' }}
            />
          ) : (
            <div 
              className="w-full text-gray-600 bg-gray-50 hover:bg-gray-100 rounded p-2.5 text-sm leading-relaxed cursor-text min-h-[2rem]"
              onDoubleClick={() => setIsEditingDescription(true)}
              title="Double-click to edit"
            >
              {description || <span className="text-gray-400">Add a description...</span>}
            </div>
          )}
        </div>
      </div>

      {/* Footer with all metadata */}
      <div className="p-4 pt-2 border-t border-gray-50">
        <div className="flex items-center flex-wrap gap-2">
          
          <button
            onClick={onProjectClick}
            className="inline-flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded text-sm transition-colors cursor-pointer"
            title="Click to change project"
          >
            {(() => {
              const project = projects.find(p => p.id === task.projectId)
              const projectColor = project ? getTodoistColor(project.color) : '#299fe6'
              return (
                <>
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: projectColor }}
                  ></div>
                  <span className="text-gray-700">
                    {project?.name || 'Unknown Project'}
                  </span>
                </>
              )
            })()}
          </button>
          <button
            onClick={onPriorityClick}
            className={`px-2.5 py-1.5 text-sm font-medium rounded transition-colors hover:opacity-80 cursor-pointer ${getPriorityColor(task.priority)}`}
            title="Click to change priority"
          >
            P{getUIPriority(task.priority)} • {getPriorityLabel(task.priority)}
          </button>
          
          {/* Scheduled Date */}
          {dateLoadingState === 'due' ? (
            <div className="inline-flex items-center space-x-1.5 bg-gray-100 px-2.5 py-1.5 rounded text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
              <span className="text-gray-500">Updating...</span>
            </div>
          ) : task.due ? (() => {
            const colors = getDateColor(task.due.date, false);
            const label = getDateTimeLabel(task.due.date, true);
            const fullDateTime = getFullDateTime(task.due.date);
            return (
              <button
                onClick={onScheduledClick}
                className={`inline-flex items-center space-x-1.5 ${colors.bg} hover:opacity-80 px-2.5 py-1.5 rounded text-sm transition-colors cursor-pointer`}
                title={fullDateTime}
              >
                <svg className={`w-4 h-4 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={colors.text}>
                  {label}
                </span>
              </button>
            );
          })() : (
            <button
              onClick={onScheduledClick}
              className="inline-flex items-center space-x-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded text-sm transition-colors"
              title="Add scheduled date"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Schedule</span>
            </button>
          )}
          
          {/* Deadline */}
          {dateLoadingState === 'deadline' ? (
            <div className="inline-flex items-center space-x-1.5 bg-gray-100 px-2.5 py-1.5 rounded text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
              <span className="text-gray-500">Updating...</span>
            </div>
          ) : task.deadline ? (() => {
            const colors = getDateColor(task.deadline.date, true);
            const label = getDateTimeLabel(task.deadline.date, true);
            const fullDateTime = getFullDateTime(task.deadline.date);
            return (
              <button
                onClick={onDeadlineClick}
                className={`inline-flex items-center space-x-1.5 ${colors.bg} hover:opacity-80 px-2.5 py-1.5 rounded text-sm transition-colors cursor-pointer`}
                title={fullDateTime}
              >
                <svg className={`w-4 h-4 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={colors.text}>
                  {label}
                </span>
              </button>
            );
          })() : (
            <button
              onClick={onDeadlineClick}
              className="inline-flex items-center space-x-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded text-sm transition-colors"
              title="Add deadline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Deadline</span>
            </button>
          )}
          
          {/* Assignee - only show if there are collaborators or task is already assigned */}
          {(task.assigneeId || hasCollaborators) && (
            <>
              {task.assigneeId ? (
                <button
                  onClick={onAssigneeClick}
                  className="inline-flex items-center space-x-1.5 bg-purple-100 hover:bg-purple-200 px-2.5 py-1.5 rounded text-sm transition-colors cursor-pointer"
                  title={assignee ? `Assigned to ${assignee.name}` : "Click to change assignee"}
                >
                  {assignee?.avatarSmall ? (
                    <>
                      <img 
                        src={assignee.avatarSmall} 
                        alt={assignee.name}
                        className="w-4 h-4 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      <svg className="w-4 h-4 text-purple-700 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </>
                  ) : (
                    <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  <span className="text-purple-700">
                    {assignee ? assignee.name : 'Unknown'}
                  </span>
                </button>
              ) : hasCollaborators ? (
                <button
                  onClick={onAssigneeClick}
                  className="inline-flex items-center space-x-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-100 px-2.5 py-1.5 rounded text-sm transition-colors"
                  title="Assign to someone"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Assign</span>
                </button>
              ) : null}
            </>
          )}
          
          {/* Labels */}
          {task.labels.filter(labelName => !isExcludedLabel(labelName)).map((labelName) => {
            const label = labels.find(l => l.name === labelName)
            const labelColor = label ? getTodoistColor(label.color) : '#299fe6'
            return (
              <span
                key={labelName}
                className="text-sm px-2.5 py-1.5 rounded inline-flex items-center space-x-1 group relative transition-all"
                style={{ backgroundColor: `${labelColor}20`, color: labelColor }}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: labelColor }}
                ></div>
                <span>{labelName}</span>
                <button
                  onClick={() => onLabelRemove?.(labelName)}
                  className="ml-1 hover:scale-125 transition-transform"
                  title="Remove label"
                >
                  ×
                </button>
              </span>
            )
          })}
          {onLabelAdd && (
            <button
              onClick={onLabelAdd}
              className="inline-flex items-center space-x-1 text-sm px-2.5 py-1.5 rounded transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
              title="Add labels"
            >
              <span className="font-medium">+ Add Label</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Creation date - subtle, positioned at bottom right */}
      {task.createdAt && (
        <div className="absolute bottom-2 right-3 text-xs text-gray-500">
          {(() => {
            const now = new Date();
            const created = new Date(task.createdAt);
            const diffTime = Math.abs(now.getTime() - created.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Created today';
            if (diffDays === 1) return 'Created yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            if (diffDays < 365) {
              const months = Math.floor(diffDays / 30);
              return months === 1 ? '1 month ago' : `${months} months ago`;
            }
            const years = Math.floor(diffDays / 365);
            return years === 1 ? '1 year ago' : `${years} years ago`;
          })()}
        </div>
      )}
      
      {/* Debug Mode */}
      {isDebugMode && (
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 font-mono"
            title="Toggle JSON debug view"
          >
            {showDebug ? 'Hide' : 'Show'} JSON
          </button>
        </div>
      )}
      
      {/* Debug JSON View */}
      {showDebug && isDebugMode && (
        <div className="mt-4 p-4 bg-gray-900 rounded-lg overflow-auto">
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
            {JSON.stringify(task, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}