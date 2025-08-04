'use client'

import React, { useState, useCallback, memo, useEffect } from 'react'
import { TodoistTask, TodoistProject, TodoistLabel, TaskUpdate } from '@/lib/types'
import { DisplayContext } from '@/types/view-mode'
// CRITICAL: Reuse existing UI components from Processing View
import PriorityBadge from '@/components/PriorityBadge'
import LabelIcon from '@/components/LabelIcon'

interface TaskListItemProps {
  task: TodoistTask
  project?: TodoistProject
  labels: TodoistLabel[]
  displayContext: DisplayContext
  isExpanded: boolean
  isSelected: boolean
  isHighlighted: boolean
  isEditing: boolean
  onToggleExpand: () => void
  onToggleSelect: () => void
  onEdit: () => void
  onUpdate: (taskId: string, updates: TaskUpdate) => Promise<void>
  onComplete: () => void
  onProcess: () => void
  onClick: () => void
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
  onToggleExpand,
  onToggleSelect,
  onEdit,
  onUpdate,
  onComplete,
  onProcess,
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
  
  // Update edited content if task content changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditedContent(task.content)
    }
  }, [task.content, isEditing])

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
        group relative transition-colors
        ${isHighlighted ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-inset ring-blue-500' : ''}
        ${isSelected && !isHighlighted ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
        ${!isHighlighted && !isSelected ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Main task row */}
      <div className="flex items-center gap-3 px-4 py-2 min-h-[36px]">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label={`Select ${task.content}`}
        />
        
        {/* Task content and metadata */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
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
                  w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2
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
              className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate"
              onDoubleClick={onEdit}
              title="Double-click to edit"
            >
              {task.content}
            </span>
          )}
          
          {/* Inline metadata - only show what exists */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Priority - only show if > 1 and not in priority context */}
            {task.priority > 1 && !displayContext.isPriorityContext && (
              <button
                onClick={onOpenPriorityOverlay}
                className="hover:opacity-80 transition-opacity"
                title="Change priority"
              >
                <PriorityBadge priority={task.priority} />
              </button>
            )}
            
            {/* Project - only show if not in project context */}
            {project && !displayContext.isProjectContext && (
              <button
                onClick={onOpenProjectOverlay}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Move to project"
              >
                {project.name}
              </button>
            )}
            
            {/* Labels */}
            {labels.length > 0 && (
              <div className="flex items-center gap-1">
                {labels.map(label => (
                  <button
                    key={label.id}
                    onClick={onOpenLabelOverlay}
                    className={`
                      flex items-center gap-1 px-1.5 py-0.5 text-xs rounded
                      ${displayContext.isLabelContext && displayContext.highlightedLabels?.includes(label.name)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }
                      hover:opacity-80 transition-opacity
                    `}
                    title="Edit labels"
                  >
                    <LabelIcon color={label.color} />
                    {label.name}
                  </button>
                ))}
              </div>
            )}
            
            {/* Due date */}
            {task.due && (
              <button
                onClick={onOpenScheduledOverlay}
                className="px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Change scheduled date"
              >
                📅 {formatDate(task.due.date)}
              </button>
            )}
            
            {/* Deadline */}
            {task.deadline && (
              <button
                onClick={onOpenDeadlineOverlay}
                className="px-2 py-0.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Change deadline"
              >
                🎯 {formatDate(task.deadline.date)}
              </button>
            )}
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
        
        {/* Action buttons - appear on hover */}
        <div className={`
          flex items-center gap-1 transition-opacity
          ${isHovered || isHighlighted ? 'opacity-100' : 'opacity-0'}
        `}>
          
          {/* Process button */}
          <button
            onClick={onProcess}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Mark as processed (E)"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          
          {/* Complete button */}
          <button
            onClick={onComplete}
            className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            title="Complete task (C)"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
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