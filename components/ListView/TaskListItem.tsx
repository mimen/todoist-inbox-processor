'use client'

import React, { useState, useCallback, memo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { TodoistTask, TodoistProject, TodoistLabel, TaskUpdate } from '@/lib/types'
import { DisplayContext } from '@/types/view-mode'
import { isExcludedLabel } from '@/lib/excluded-labels'
import { getDateColor, getDateTimeLabel, getFullDateTime } from '@/lib/date-colors'
import { parseTodoistLinks } from '@/lib/todoist-link-parser'

interface TaskListItemProps {
  task: TodoistTask
  project?: TodoistProject
  labels: TodoistLabel[]
  displayContext: DisplayContext
  isExpanded: boolean
  isSelected: boolean
  isHighlighted: boolean
  isEditing: boolean
  showSelectionCheckbox?: boolean
  onToggleExpand: () => void
  onToggleSelect: () => void
  onEdit: () => void
  onUpdate: (taskId: string, updates: TaskUpdate) => Promise<void>
  onComplete: () => void
  onProcess: () => void
  onDelete: () => void
  onClick: (e: React.MouseEvent) => void
  // Overlay handlers passed from parent
  onOpenProjectOverlay: () => void
  onOpenPriorityOverlay: () => void
  onOpenLabelOverlay: () => void
  onOpenScheduledOverlay: () => void
  onOpenDeadlineOverlay: () => void
  onOpenAssigneeOverlay: () => void
}

/**
 * Individual task row in List View
 * Displays task with Todoist-style inline layout
 * IMPORTANT: Uses same overlays as Processing View
 */
const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  project,
  labels,
  displayContext,
  isExpanded,
  isSelected,
  isHighlighted,
  isEditing,
  showSelectionCheckbox = false,
  onToggleExpand,
  onToggleSelect,
  onEdit,
  onUpdate,
  onComplete,
  onProcess,
  onDelete,
  onClick,
  onOpenProjectOverlay,
  onOpenPriorityOverlay,
  onOpenLabelOverlay,
  onOpenScheduledOverlay,
  onOpenDeadlineOverlay,
  onOpenAssigneeOverlay,
}) => {
  const [editedContent, setEditedContent] = useState(task.content)
  const [isHovered, setIsHovered] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTapped, setIsTapped] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const completionTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Helper functions for consistent styling with TaskCard
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
  
  // Update edited content if task content changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditedContent(task.content)
    }
  }, [task.content, isEditing])
  
  // Hide tap state when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(`#task-${task.id}`)) {
        setIsTapped(false)
      }
    }
    
    if (isTapped) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isTapped, task.id])
  
  // Hide more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setShowMoreMenu(false)
      }
    }
    
    if (showMoreMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMoreMenu])

  const handleContentSubmit = useCallback(async () => {
    if (editedContent.trim() && editedContent !== task.content) {
      setIsSaving(true)
      try {
        await onUpdate(task.id, { content: editedContent.trim() })
        onEdit() // Exit edit mode on success
      } catch (error) {
        console.error('Failed to update task:', error)
        // Reset to original content on error
        setEditedContent(task.content)
        // Optionally show an error toast or inline error
      } finally {
        setIsSaving(false)
      }
    } else {
      // No changes, just exit edit mode
      setEditedContent(task.content)
      onEdit()
    }
  }, [editedContent, task.content, task.id, onUpdate, onEdit])

  // Handle task completion with delay
  const handleComplete = useCallback(() => {
    if (isCompleting) {
      // Cancel completion
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current)
        completionTimerRef.current = null
      }
      setIsCompleting(false)
    } else {
      // Start completion
      setIsCompleting(true)
      completionTimerRef.current = setTimeout(() => {
        onComplete()
        // Don't set isCompleting to false - let the task stay in completed state until it disappears
      }, 1500) // 1.5 seconds total animation
    }
  }, [isCompleting, onComplete])
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current)
      }
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleContentSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditedContent(task.content)
      onEdit() // Exit edit mode
    }
  }, [handleContentSubmit, task.content, onEdit])

  // Format dates
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      id={`task-${task.id}`}
      className={`
        group relative transition-all
        ${isHighlighted ? 'bg-blue-50 dark:bg-blue-900/10 shadow-sm' : ''}
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
        ${!isHighlighted && !isSelected ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onTouchStart={() => setIsTapped(true)}
    >
      {/* Main task row */}
      <div className="flex items-start gap-3 px-4 py-2 min-h-[32px]">
        {/* Selection checkbox - shown when multi-selecting */}
        {showSelectionCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onToggleSelect()
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
            aria-label={`Select ${task.content}`}
          />
        )}
        
        {/* Priority-colored completion checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleComplete()
          }}
          className="relative w-[18px] h-[18px] flex-shrink-0 group/checkbox mt-0.5"
          aria-label={`${isCompleting ? 'Cancel completion of' : 'Complete'} ${task.content}`}
        >
          {isCompleting ? (
            <>
              {/* Soft pulse glow effect */}
              <div className={`
                absolute inset-0 rounded-full animate-softPulse
                ${task.priority === 4 ? 'bg-red-500/20' :
                  task.priority === 3 ? 'bg-orange-500/20' :
                  task.priority === 2 ? 'bg-blue-500/20' :
                  'bg-gray-400/20'
                }
              `} />
              
              {/* Border ring */}
              <div className={`
                absolute inset-0 rounded-full border-[1.5px]
                ${task.priority === 4 ? 'border-red-500' :
                  task.priority === 3 ? 'border-orange-500' :
                  task.priority === 2 ? 'border-blue-500' :
                  'border-gray-400'
                }
              `} />
              
              {/* Fill circle */}
              <div className={`
                absolute inset-0 rounded-full animate-softFill
                ${task.priority === 4 ? 'bg-red-500' :
                  task.priority === 3 ? 'bg-orange-500' :
                  task.priority === 2 ? 'bg-blue-500' :
                  'bg-gray-400'
                }
              `} />
              
              {/* Checkmark */}
              <svg 
                className="absolute inset-0 w-full h-full p-0.5 animate-softCheck" 
                viewBox="0 0 16 16" 
                fill="none"
              >
                <path 
                  d="M3 8l3 3 7-7" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </>
          ) : (
            <>
              <div className={`
                absolute inset-0 rounded-full border-[1.5px] transition-all
                ${task.priority === 4 ? 'border-red-500 bg-red-50/30 dark:bg-red-500/10 hover:bg-red-50 dark:hover:bg-red-900/20' :
                  task.priority === 3 ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-500/10 hover:bg-orange-50 dark:hover:bg-orange-900/20' :
                  task.priority === 2 ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-500/10 hover:bg-blue-50 dark:hover:bg-blue-900/20' :
                  'border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }
              `} />
              <svg 
                className="absolute inset-0 w-full h-full opacity-0 group-hover/checkbox:opacity-100 transition-opacity p-0.5" 
                viewBox="0 0 16 16" 
                fill="none"
              >
                <path 
                  d="M3 8l3 3 7-7" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={`
                    ${task.priority === 4 ? 'text-red-500' :
                      task.priority === 3 ? 'text-orange-500' :
                      task.priority === 2 ? 'text-blue-500' :
                      'text-gray-400'
                    }
                  `}
                />
              </svg>
            </>
          )}
        </button>
        
        {/* Task content and metadata */}
        <div className="flex-1 flex items-start gap-2 min-w-0">
          {/* Task content */}
          {isEditing ? (
            <div className="flex-1 relative">
              <input
                type="text"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onBlur={handleContentSubmit}
                onKeyDown={handleKeyDown}
                className={`
                  w-full px-1 py-0 text-sm border rounded focus:outline-none focus:ring-2 -my-px
                  ${isSaving 
                    ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }
                `}
                autoFocus
                disabled={isSaving}
              />
              {isSaving && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          ) : (
            <span 
              className="flex-1 text-sm text-gray-900 dark:text-gray-100 line-clamp-2"
              onDoubleClick={onEdit}
              title={task.content}
            >
              {parseTodoistLinks(task.content).map((segment, index) => {
                if (segment.type === 'text') {
                  return <span key={index}>{segment.content}</span>
                } else {
                  return (
                    <a
                      key={index}
                      href={segment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {segment.content}
                    </a>
                  )
                }
              })}
            </span>
          )}
          
          {/* Inline metadata - only show what exists */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Priority - only show if > 1 and not in priority context */}
            {task.priority > 1 && !displayContext.isPriorityContext && (
              <button
                onClick={onOpenPriorityOverlay}
                className={`px-1.5 py-0.5 text-xs font-medium rounded transition-colors hover:opacity-80 cursor-pointer ${getPriorityColor(task.priority)}`}
                title="Change priority"
              >
                P{getUIPriority(task.priority)}
              </button>
            )}
            
            {/* Project - only show if not in project context */}
            {project && !displayContext.isProjectContext && (
              <button
                onClick={onOpenProjectOverlay}
                className="inline-flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-1.5 py-0.5 rounded text-xs transition-colors cursor-pointer"
                title="Move to project"
              >
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getTodoistColor(project.color) }}
                />
                <span>{project.name}</span>
              </button>
            )}
            
            {/* Labels */}
            {labels.filter(l => !isExcludedLabel(l.name)).map((label) => {
              const labelColor = getTodoistColor(label.color)
              return (
                <button
                  key={label.id}
                  onClick={onOpenLabelOverlay}
                  className="text-xs px-1.5 py-0.5 rounded inline-flex items-center space-x-1 group relative transition-all hover:opacity-80"
                  style={{ backgroundColor: `${labelColor}20`, color: labelColor }}
                  title="Edit labels"
                >
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: labelColor }}
                  />
                  <span>{label.name}</span>
                </button>
              )
            })}
            
            {/* Due date */}
            {task.due && (() => {
              const colors = getDateColor(task.due.date, false)
              const label = getDateTimeLabel(task.due.date, true)
              const fullDateTime = getFullDateTime(task.due.date)
              return (
                <button
                  onClick={onOpenScheduledOverlay}
                  className={`inline-flex items-center space-x-1 ${colors.bg} hover:opacity-80 px-1.5 py-0.5 rounded text-xs transition-colors cursor-pointer`}
                  title={fullDateTime}
                >
                  <svg className={`w-3 h-3 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className={colors.text}>{label}</span>
                </button>
              )
            })()}
            
            {/* Deadline */}
            {task.deadline && (() => {
              const colors = getDateColor(task.deadline.date, true)
              const label = getDateTimeLabel(task.deadline.date, true)
              const fullDateTime = getFullDateTime(task.deadline.date)
              return (
                <button
                  onClick={onOpenDeadlineOverlay}
                  className={`inline-flex items-center space-x-1 ${colors.bg} hover:opacity-80 px-1.5 py-0.5 rounded text-xs transition-colors cursor-pointer`}
                  title={fullDateTime}
                >
                  <svg className={`w-3 h-3 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={colors.text}>{label}</span>
                </button>
              )
            })()}
          </div>
        </div>
        
        {/* Description indicator - always visible if task has description */}
        {task.description && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand()
              }}
              className={`
                p-1 transition-all flex items-center gap-1
                ${isExpanded 
                  ? 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }
              `}
              title={isExpanded ? 'Hide description' : 'Show description'}
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path 
                  d="M3 5h10M3 8h10M3 11h7" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                />
              </svg>
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
                <path 
                  d={isExpanded ? 'M4 6l4 4 4-4' : 'M6 4l4 4-4 4'} 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex items-center gap-1">
          
          
          {/* More menu button */}
          <div className="relative" ref={moreMenuRef}>
            <button
              ref={moreButtonRef}
              onClick={(e) => {
                e.stopPropagation()
                if (!showMoreMenu && moreButtonRef.current) {
                  const rect = moreButtonRef.current.getBoundingClientRect()
                  setMenuPosition({
                    top: rect.bottom + 5, // 5px below the button
                    left: rect.right - 160 // Align menu right edge with button
                  })
                }
                setShowMoreMenu(!showMoreMenu)
              }}
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="More actions"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3" r="1" fill="currentColor"/>
                <circle cx="8" cy="8" r="1" fill="currentColor"/>
                <circle cx="8" cy="13" r="1" fill="currentColor"/>
              </svg>
            </button>
            
            {/* More menu dropdown - rendered as portal */}
            {showMoreMenu && menuPosition && typeof window !== 'undefined' && createPortal(
              <div 
                className="fixed w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-[9999] max-h-80 overflow-y-auto"
                style={{ 
                  top: `${menuPosition.top}px`, 
                  left: `${menuPosition.left}px`
                }}
              >
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onProcess()
                      setShowMoreMenu(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1L3 9h5v6l5-8H8V1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Process task</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenProjectOverlay()
                      setShowMoreMenu(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center text-xs">#</div>
                    <span>Move to project</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenLabelOverlay()
                      setShowMoreMenu(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center text-xs">@</div>
                    <span>Edit labels</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenScheduledOverlay()
                      setShowMoreMenu(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Schedule</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenDeadlineOverlay()
                      setShowMoreMenu(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Set deadline</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenAssigneeOverlay()
                      setShowMoreMenu(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Assign to</span>
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                      setShowMoreMenu(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete task</span>
                  </button>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>
      
      {/* Expanded description with animation */}
      <div 
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isExpanded && task.description ? 'max-h-96' : 'max-h-0'
        }`}
      >
        {task.description && (
          <div className="px-4 py-2 ml-10 mr-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
            {task.description}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(TaskListItem)