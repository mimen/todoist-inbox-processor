'use client'

import React from 'react'
import { useFocusedTask } from '@/contexts/FocusedTaskContext'
import { useOverlayContext } from '@/contexts/OverlayContext'
import PriorityOverlay from './PriorityOverlay'
import ProjectSelectionOverlay from './ProjectSelectionOverlay'
import LabelSelectionOverlay from './LabelSelectionOverlay'
import ScheduledDateSelector from './ScheduledDateSelector'
import DeadlineSelector from './DeadlineSelector'
import AssigneeSelectionOverlay from './AssigneeSelectionOverlay'
import { TodoistTask, TodoistProject, TodoistLabel, TodoistUser, TaskUpdate } from '@/lib/types'

interface OverlayManagerProps {
  // Data needed by overlays
  projects: TodoistProject[]
  labels: TodoistLabel[]
  projectCollaborators: Record<string, TodoistUser[]>
  masterTasks: Record<string, TodoistTask>
  
  // Task update handler
  onTaskUpdate: (taskId: string, updates: TaskUpdate) => Promise<void>
  
  // Task completion handler
  onCompleteTask?: () => void
  
  // Optional suggestions for project overlay
  suggestions?: any[]
}

export default function OverlayManager({
  projects,
  labels,
  projectCollaborators,
  masterTasks,
  onTaskUpdate,
  onCompleteTask,
  suggestions = []
}: OverlayManagerProps) {
  const { focusedTask } = useFocusedTask()
  const { overlays, closeOverlay } = useOverlayContext()
  const completeOverlayRef = React.useRef<HTMLDivElement>(null)
  
  // Handle keyboard events for complete overlay
  React.useEffect(() => {
    if (!overlays.complete) return
    
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        closeOverlay('complete')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        
        if (!focusedTask) return
        
        closeOverlay('complete')
        
        // If onCompleteTask is provided (processing view), use it
        if (onCompleteTask) {
          onCompleteTask()
        } else {
          // Otherwise, complete the task directly (list view)
          try {
            const response = await fetch(`/api/todoist/tasks/${focusedTask.id}/complete`, {
              method: 'POST',
            })
            if (!response.ok) {
              throw new Error('Failed to complete task')
            }
            
            // Update the task as completed in local state
            await onTaskUpdate(focusedTask.id, { isCompleted: true })
          } catch (error) {
            console.error('Failed to complete task:', error)
          }
        }
      }
    }
    
    // Add event listener with capture to intercept before other handlers
    window.addEventListener('keydown', handleKeyDown, true)
    
    // Focus the overlay
    setTimeout(() => {
      completeOverlayRef.current?.focus()
    }, 0)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [overlays.complete, closeOverlay, focusedTask, onCompleteTask, onTaskUpdate])
  
  
  // If no focused task, we can't render overlays that need task data
  if (!focusedTask) {
    return null
  }

  // Get the latest task data from master store
  const currentTaskData = masterTasks[focusedTask.id] || focusedTask

  const handlePrioritySelect = async (priority: 1 | 2 | 3 | 4) => {
    closeOverlay('priority')
    await onTaskUpdate(focusedTask.id, { priority })
  }

  const handleProjectSelect = async (projectId: string) => {
    closeOverlay('project')
    await onTaskUpdate(focusedTask.id, { projectId })
  }

  const handleLabelsChange = async (labels: string[]) => {
    closeOverlay('label')
    await onTaskUpdate(focusedTask.id, { labels })
  }

  const handleScheduledDateChange = async (dateString: string) => {
    closeOverlay('scheduled')
    const updates: any = { dueString: dateString }
    if (dateString) {
      updates.due = { 
        date: dateString,
        string: dateString,
        recurring: false 
      }
    } else {
      updates.due = undefined
    }
    await onTaskUpdate(focusedTask.id, updates)
  }

  const handleDeadlineChange = async (dateString: string) => {
    closeOverlay('deadline')
    await onTaskUpdate(focusedTask.id, { deadline: dateString || null })
  }

  const handleAssigneeSelect = async (userId: string | null) => {
    closeOverlay('assignee')
    await onTaskUpdate(focusedTask.id, { assigneeId: userId || undefined })
  }

  return (
    <>
      {/* Priority Overlay */}
      {overlays.priority && (
        <PriorityOverlay
          currentPriority={currentTaskData.priority}
          onPrioritySelect={handlePrioritySelect}
          onClose={() => closeOverlay('priority')}
          isVisible={true}
        />
      )}

      {/* Project Selection Overlay */}
      {overlays.project && (
        <ProjectSelectionOverlay
          key={`project-overlay-${focusedTask.id}`}
          projects={projects}
          currentProjectId={currentTaskData.projectId}
          currentTask={currentTaskData}
          suggestions={suggestions}
          onProjectSelect={handleProjectSelect}
          onClose={() => closeOverlay('project')}
          isVisible={true}
        />
      )}

      {/* Label Selection Overlay */}
      {overlays.label && (
        <LabelSelectionOverlay
          labels={labels}
          currentTask={currentTaskData}
          onLabelsChange={handleLabelsChange}
          onClose={() => closeOverlay('label')}
          isVisible={true}
        />
      )}

      {/* Scheduled Date Selector */}
      {overlays.scheduled && (
        <ScheduledDateSelector
          currentTask={currentTaskData}
          onScheduledDateChange={handleScheduledDateChange}
          onClose={() => closeOverlay('scheduled')}
          isVisible={true}
        />
      )}

      {/* Deadline Selector */}
      {overlays.deadline && (
        <DeadlineSelector
          currentTask={currentTaskData}
          onDeadlineChange={handleDeadlineChange}
          onClose={() => closeOverlay('deadline')}
          isVisible={true}
        />
      )}

      {/* Assignee Selection Overlay */}
      {overlays.assignee && (
        <AssigneeSelectionOverlay
          isVisible={true}
          onClose={() => closeOverlay('assignee')}
          onAssigneeSelect={handleAssigneeSelect}
          currentAssigneeId={currentTaskData.assigneeId}
          collaborators={projectCollaborators[currentTaskData.projectId] || []}
        />
      )}

      {/* Complete Confirmation Dialog */}
      {overlays.complete && (
        <div 
          ref={completeOverlayRef}
          tabIndex={-1}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 focus:outline-none"
          onClick={() => closeOverlay('complete')}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Complete Task?</h3>
            <p className="text-gray-600 mb-4">
              Mark this task as completed. This action can be undone from your completed tasks.
            </p>
            <p className="text-sm font-medium text-gray-800 mb-6 p-3 bg-gray-50 rounded">
              &ldquo;{currentTaskData.content}&rdquo;
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => closeOverlay('complete')}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!focusedTask) return
                  
                  closeOverlay('complete')
                  
                  // If onCompleteTask is provided (processing view), use it
                  if (onCompleteTask) {
                    onCompleteTask()
                  } else {
                    // Otherwise, complete the task directly (list view)
                    try {
                      const response = await fetch(`/api/todoist/tasks/${focusedTask.id}/complete`, {
                        method: 'POST',
                      })
                      if (!response.ok) {
                        throw new Error('Failed to complete task')
                      }
                      
                      // Update the task as completed in local state
                      await onTaskUpdate(focusedTask.id, { isCompleted: true })
                    } catch (error) {
                      console.error('Failed to complete task:', error)
                    }
                  }
                }}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}