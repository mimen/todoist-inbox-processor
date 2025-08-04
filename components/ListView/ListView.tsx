'use client'

import React, { useMemo, useCallback, memo, useEffect, useRef, useState } from 'react'
import { TodoistTask, TodoistProject, TodoistLabel, TaskUpdate, TodoistUser } from '@/lib/types'
import { ProcessingMode } from '@/types/processing-mode'
import { ListViewState, getDisplayContext } from '@/types/view-mode'
import TaskListItem from './TaskListItem'
import ListHeader from './ListHeader'
import { filterTasksByMode } from '@/lib/task-filters'

interface ListViewProps {
  tasks: TodoistTask[]
  projects: TodoistProject[]
  labels: TodoistLabel[]
  processingMode: ProcessingMode
  projectMetadata: Record<string, any>
  listViewState: ListViewState
  slidingOutTaskIds: string[]
  onListViewStateChange: (state: ListViewState) => void
  onTaskUpdate: (taskId: string, updates: TaskUpdate) => Promise<void>
  onTaskComplete: (taskId: string) => void
  onTaskProcess: (taskId: string) => void
  onTaskDelete: (taskId: string) => void
  onViewModeChange: (mode: 'processing') => void
  currentUserId: string
  collaborators?: Record<string, TodoistUser[]>
  // Add overlay handlers from parent
  onOpenProjectOverlay: (taskId: string) => void
  onOpenPriorityOverlay: (taskId: string) => void
  onOpenLabelOverlay: (taskId: string) => void
  onOpenScheduledOverlay: (taskId: string) => void
  onOpenDeadlineOverlay: (taskId: string) => void
  onOpenAssigneeOverlay: (taskId: string) => void
}

/**
 * Main List View component
 * Displays all tasks in current queue in a compact, scannable format
 * IMPORTANT: Reuses overlays from Processing View via props
 */
const ListView: React.FC<ListViewProps> = ({
  tasks,
  projects,
  labels,
  processingMode,
  projectMetadata,
  listViewState,
  slidingOutTaskIds,
  onListViewStateChange,
  onTaskUpdate,
  onTaskComplete,
  onTaskProcess,
  onTaskDelete,
  onViewModeChange,
  currentUserId,
  collaborators = {},
  onOpenProjectOverlay,
  onOpenPriorityOverlay,
  onOpenLabelOverlay,
  onOpenScheduledOverlay,
  onOpenDeadlineOverlay,
  onOpenAssigneeOverlay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMetaKeyHeld, setIsMetaKeyHeld] = useState(false)
  
  // Get display context for hiding redundant information
  const displayContext = useMemo(() => 
    getDisplayContext(processingMode), 
    [processingMode]
  )

  // Create project lookup map
  const projectMap = useMemo(() => {
    const map: Record<string, TodoistProject> = {}
    projects.forEach(project => {
      map[project.id] = project
    })
    return map
  }, [projects])

  // Sort tasks based on current sort option
  const sortedTasks = useMemo(() => {
    const tasksCopy = [...tasks]
    
    switch (listViewState.sortBy) {
      case 'priority':
        return tasksCopy.sort((a, b) => {
          if (b.priority !== a.priority) {
            return b.priority - a.priority // P1 (4) first
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })
      
      case 'dueDate':
        return tasksCopy.sort((a, b) => {
          if (!a.due && !b.due) return 0
          if (!a.due) return 1
          if (!b.due) return -1
          
          const dateA = new Date(a.due.date)
          const dateB = new Date(b.due.date)
          return dateA.getTime() - dateB.getTime()
        })
      
      case 'createdAt':
        return tasksCopy.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      
      case 'alphabetical':
        return tasksCopy.sort((a, b) => 
          a.content.toLowerCase().localeCompare(b.content.toLowerCase())
        )
      
      default:
        return tasksCopy // Original order
    }
  }, [tasks, listViewState.sortBy])

  // Auto-highlight first task if none selected
  useEffect(() => {
    if (!listViewState.highlightedTaskId && sortedTasks.length > 0) {
      onListViewStateChange({
        ...listViewState,
        highlightedTaskId: sortedTasks[0].id
      })
    }
  }, [sortedTasks.length, listViewState.highlightedTaskId, onListViewStateChange])

  // Return focus to container when editing is finished
  useEffect(() => {
    if (!listViewState.editingTaskId && containerRef.current) {
      containerRef.current.focus()
    }
  }, [listViewState.editingTaskId])

  // Focus the container when component mounts or becomes visible
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus()
    }
  }, [])
  
  // Track meta key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        setIsMetaKeyHeld(true)
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) {
        setIsMetaKeyHeld(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Scroll highlighted task into view
  useEffect(() => {
    if (listViewState.highlightedTaskId) {
      const element = document.getElementById(`task-${listViewState.highlightedTaskId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [listViewState.highlightedTaskId])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const highlightedTask = sortedTasks.find(t => t.id === listViewState.highlightedTaskId)
    
    
    // If we're editing, only handle Escape to cancel editing
    if (listViewState.editingTaskId) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onListViewStateChange({
          ...listViewState,
          editingTaskId: null
        })
      }
      // Don't process any other keys while editing
      return
    }
    
    // List View specific shortcuts
    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault()
      onViewModeChange('processing')
      return
    }
    
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      e.preventDefault()
      // Select all tasks
      const allTaskIds = new Set(sortedTasks.map(t => t.id))
      onListViewStateChange({
        ...listViewState,
        selectedTaskIds: allTaskIds
      })
      return
    }
    
    if (e.key === 'Escape' && listViewState.selectedTaskIds.size > 0) {
      e.preventDefault()
      // Clear selection
      onListViewStateChange({
        ...listViewState,
        selectedTaskIds: new Set()
      })
      return
    }
    
    if (e.key === 'Enter' && highlightedTask) {
      e.preventDefault()
      // Switch to processing view with this task
      onTaskProcess(highlightedTask.id)
      return
    }
    
    // Navigation (only when not editing)
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault()
      const currentIndex = sortedTasks.findIndex(t => t.id === listViewState.highlightedTaskId)
      const nextIndex = currentIndex < sortedTasks.length - 1 ? currentIndex + 1 : 0
      onListViewStateChange({
        ...listViewState,
        highlightedTaskId: sortedTasks[nextIndex]?.id || null
      })
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault()
      const currentIndex = sortedTasks.findIndex(t => t.id === listViewState.highlightedTaskId)
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : sortedTasks.length - 1
      onListViewStateChange({
        ...listViewState,
        highlightedTaskId: sortedTasks[prevIndex]?.id || null
      })
    }
    
    // Task actions on highlighted task
    if (highlightedTask) {
      switch (e.key) {
        case '#':
          e.preventDefault()
          onOpenProjectOverlay(highlightedTask.id)
          break
          
        case '@':
          e.preventDefault()
          onOpenLabelOverlay(highlightedTask.id)
          break
          
        case 's':
        case 'S':
          e.preventDefault()
          onOpenScheduledOverlay(highlightedTask.id)
          break
          
        case 'd':
        case 'D':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            onOpenDeadlineOverlay(highlightedTask.id)
          }
          break
          
        case 'p':
        case 'P':
          if (!e.shiftKey) {
            if (e.metaKey || e.ctrlKey) {
              // Cmd+P or Ctrl+P for priority overlay
              e.preventDefault()
              onOpenPriorityOverlay(highlightedTask.id)
            } else if (!e.metaKey && !e.ctrlKey) {
              // Regular P key
              e.preventDefault()
              onOpenPriorityOverlay(highlightedTask.id)
            }
          }
          break
          
        case '+':
          e.preventDefault()
          onOpenAssigneeOverlay(highlightedTask.id)
          break
          
        case 'c':
          e.preventDefault()
          // Don't complete directly, trigger the confirmation overlay
          onTaskComplete(highlightedTask.id)
          break
          
        case 'e':
          e.preventDefault()
          onListViewStateChange({
            ...listViewState,
            editingTaskId: highlightedTask.id
          })
          break
          
        case ' ':
          e.preventDefault()
          const newExpanded = new Set(listViewState.expandedDescriptions)
          if (newExpanded.has(highlightedTask.id)) {
            newExpanded.delete(highlightedTask.id)
          } else {
            newExpanded.add(highlightedTask.id)
          }
          onListViewStateChange({
            ...listViewState,
            expandedDescriptions: newExpanded
          })
          break
          
      }
    }
  }, [sortedTasks, listViewState, onListViewStateChange, onTaskProcess, onTaskComplete,
      onOpenProjectOverlay, onOpenPriorityOverlay, onOpenLabelOverlay, 
      onOpenScheduledOverlay, onOpenDeadlineOverlay, onOpenAssigneeOverlay])

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ListHeader
          processingMode={processingMode}
          taskCount={0}
          sortBy={listViewState.sortBy}
          onSortChange={(sortBy) => onListViewStateChange({ ...listViewState, sortBy })}
        />
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-lg font-medium">No tasks to display</p>
          <p className="text-sm mt-1">Tasks matching your current filters will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      data-list-view-container
      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <ListHeader
        processingMode={processingMode}
        taskCount={tasks.length}
        sortBy={listViewState.sortBy}
        onSortChange={(sortBy) => onListViewStateChange({ ...listViewState, sortBy })}
      />
      
      {/* Task List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {sortedTasks.map((task) => {
          const project = projectMap[task.projectId]
          const taskLabels = labels.filter(l => task.labels.includes(l.name))
          
          const isSliding = slidingOutTaskIds.includes(task.id)
          
          return (
            <div
              key={task.id}
              className={isSliding ? 'animate-fade-out-task' : ''}
            >
              <TaskListItem
                task={task}
                project={project}
                labels={taskLabels}
                displayContext={displayContext}
                isExpanded={listViewState.expandedDescriptions.has(task.id)}
                isSelected={listViewState.selectedTaskIds.has(task.id)}
                isHighlighted={listViewState.highlightedTaskId === task.id}
                isEditing={listViewState.editingTaskId === task.id}
                showSelectionCheckbox={isMetaKeyHeld || listViewState.selectedTaskIds.size > 0}
              onToggleExpand={() => {
                const newExpanded = new Set(listViewState.expandedDescriptions)
                if (newExpanded.has(task.id)) {
                  newExpanded.delete(task.id)
                } else {
                  newExpanded.add(task.id)
                }
                onListViewStateChange({ ...listViewState, expandedDescriptions: newExpanded })
              }}
              onToggleSelect={() => {
                const newSelected = new Set(listViewState.selectedTaskIds)
                if (newSelected.has(task.id)) {
                  newSelected.delete(task.id)
                } else {
                  newSelected.add(task.id)
                }
                onListViewStateChange({ ...listViewState, selectedTaskIds: newSelected })
              }}
              onEdit={() => {
                // Toggle edit mode - if we're editing this task, stop; otherwise start
                onListViewStateChange({ 
                  ...listViewState, 
                  editingTaskId: listViewState.editingTaskId === task.id ? null : task.id,
                  highlightedTaskId: task.id 
                })
              }}
              onUpdate={onTaskUpdate}
              onComplete={() => onTaskComplete(task.id)}
              onProcess={() => onTaskProcess(task.id)}
              onDelete={() => onTaskDelete(task.id)}
              onClick={(e) => {
                // Handle Shift+Click for range selection
                if (e.shiftKey && listViewState.highlightedTaskId) {
                  const startIndex = sortedTasks.findIndex(t => t.id === listViewState.highlightedTaskId)
                  const endIndex = sortedTasks.findIndex(t => t.id === task.id)
                  
                  if (startIndex !== -1 && endIndex !== -1) {
                    const start = Math.min(startIndex, endIndex)
                    const end = Math.max(startIndex, endIndex)
                    const rangeTaskIds = sortedTasks.slice(start, end + 1).map(t => t.id)
                    
                    const newSelected = new Set(listViewState.selectedTaskIds)
                    rangeTaskIds.forEach(id => newSelected.add(id))
                    
                    onListViewStateChange({
                      ...listViewState,
                      selectedTaskIds: newSelected,
                      highlightedTaskId: task.id
                    })
                  }
                }
                // Handle Cmd+Click for multi-selection
                else if (e.metaKey || e.ctrlKey) {
                  const newSelected = new Set(listViewState.selectedTaskIds)
                  if (newSelected.has(task.id)) {
                    newSelected.delete(task.id)
                  } else {
                    newSelected.add(task.id)
                  }
                  
                  onListViewStateChange({
                    ...listViewState,
                    selectedTaskIds: newSelected,
                    highlightedTaskId: task.id
                  })
                }
                // Regular click
                else {
                  onListViewStateChange({
                    ...listViewState,
                    highlightedTaskId: task.id
                  })
                }
              }}
              // Pass through overlay handlers
              onOpenProjectOverlay={() => onOpenProjectOverlay(task.id)}
              onOpenPriorityOverlay={() => onOpenPriorityOverlay(task.id)}
              onOpenLabelOverlay={() => onOpenLabelOverlay(task.id)}
              onOpenScheduledOverlay={() => onOpenScheduledOverlay(task.id)}
              onOpenDeadlineOverlay={() => onOpenDeadlineOverlay(task.id)}
              onOpenAssigneeOverlay={() => onOpenAssigneeOverlay(task.id)}
            />
            </div>
          )
        })}
      </div>
      
      {/* Footer with summary */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>{tasks.length} tasks</span>
          <span className="text-xs">
            Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">V</kbd> to toggle view
          </span>
        </div>
      </div>
    </div>
  )
}

export default memo(ListView)