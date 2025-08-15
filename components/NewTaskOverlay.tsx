'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TodoistTask, TodoistProject, TodoistLabel, TodoistUser } from '@/lib/types'
import { useOverlayContext } from '@/contexts/OverlayContext'
import { useFocusedTask } from '@/contexts/FocusedTaskContext'
import TaskCard from './TaskCard'
import { X } from 'lucide-react'

interface NewTaskOverlayProps {
  projects: TodoistProject[]
  labels: TodoistLabel[]
  projectCollaborators: Record<string, TodoistUser[]>
  onTaskCreate: (taskData: {
    content: string
    description?: string
    projectId: string
    priority?: 1 | 2 | 3 | 4
    labels?: string[]
    dueString?: string
    deadline?: string
    assigneeId?: string
  }) => Promise<void>
  isVisible: boolean
}

export default function NewTaskOverlay({ 
  projects, 
  labels, 
  projectCollaborators,
  onTaskCreate,
  isVisible 
}: NewTaskOverlayProps) {
  const { closeOverlay, openOverlay } = useOverlayContext()
  const { setFocusedTask } = useFocusedTask()
  const [isCreating, setIsCreating] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Create a temporary task object for the form
  const [tempTask, setTempTask] = useState<TodoistTask>({
    id: 'new-task-temp',
    content: '',
    description: '',
    projectId: projects.find(p => p.isInboxProject)?.id || projects[0]?.id || '',
    sectionId: undefined,
    parentId: undefined,
    order: 0,
    priority: 1,
    labels: [],
    due: undefined,
    duration: undefined,
    deadline: undefined,
    url: '',
    commentCount: 0,
    assigneeId: undefined,
    createdAt: new Date().toISOString(),
    isCompleted: false
  })

  // Reset when opening
  useEffect(() => {
    if (isVisible) {
      const inboxProject = projects.find(p => p.isInboxProject)
      setTempTask(prev => ({
        ...prev,
        content: '',
        description: '',
        projectId: inboxProject?.id || projects[0]?.id || prev.projectId,
        priority: 1,
        labels: [],
        due: undefined,
        deadline: undefined,
        assigneeId: undefined
      }))
      setHasUnsavedChanges(false)
      
      // Set this as the focused task to enable overlay interactions
      setFocusedTask('new-task-temp', tempTask, {
        isNewTask: true
      })
    }
  }, [isVisible, projects, setFocusedTask])

  const handleContentChange = useCallback((newContent: string) => {
    setTempTask(prev => ({ ...prev, content: newContent }))
    setHasUnsavedChanges(true)
  }, [])

  const handleDescriptionChange = useCallback((newDescription: string) => {
    setTempTask(prev => ({ ...prev, description: newDescription }))
    setHasUnsavedChanges(true)
  }, [])

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges && tempTask.content.trim()) {
      setShowConfirmDialog(true)
    } else {
      closeOverlay('newTask')
    }
  }, [hasUnsavedChanges, tempTask.content, closeOverlay])

  const handleConfirmClose = useCallback(() => {
    setShowConfirmDialog(false)
    closeOverlay('newTask')
  }, [closeOverlay])

  const handleCancelClose = useCallback(() => {
    setShowConfirmDialog(false)
  }, [])

  const handleCreate = useCallback(async () => {
    if (!tempTask.content.trim() || isCreating) return
    
    try {
      setIsCreating(true)
      
      await onTaskCreate({
        content: tempTask.content.trim(),
        description: tempTask.description || undefined,
        projectId: tempTask.projectId,
        priority: tempTask.priority,
        labels: tempTask.labels,
        dueString: tempTask.due?.string,
        deadline: tempTask.deadline,
        assigneeId: tempTask.assigneeId
      })
      
      // Close overlay after successful creation
      closeOverlay('newTask')
    } catch (error) {
      console.error('Failed to create task:', error)
      // Could show error toast here
    } finally {
      setIsCreating(false)
    }
  }, [tempTask, isCreating, onTaskCreate, closeOverlay])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape
      if (e.key === 'Escape' && !showConfirmDialog) {
        e.preventDefault()
        handleClose()
      }
      
      // Handle Cmd/Ctrl+Enter to create task
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCreate()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, showConfirmDialog, handleClose, handleCreate])

  // Update temp task when overlays update it
  const handleTaskUpdate = useCallback((updates: any) => {
    setTempTask(prev => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }, [])

  if (!isVisible) return null

  // Get current project for collaborators
  const currentProject = projects.find(p => p.id === tempTask.projectId)
  const hasCollaborators = currentProject && projectCollaborators[currentProject.id]?.length > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Task Card */}
        <div className="flex-1 overflow-y-auto p-6">
          <TaskCard 
            task={tempTask}
            projects={projects}
            labels={labels}
            hasCollaborators={hasCollaborators}
            onContentChange={handleContentChange}
            onDescriptionChange={handleDescriptionChange}
            onProjectClick={() => openOverlay('project')}
            onPriorityClick={() => openOverlay('priority')}
            onLabelAdd={() => openOverlay('label')}
            onLabelRemove={(labelName) => {
              const newLabels = tempTask.labels.filter(l => l !== labelName)
              handleTaskUpdate({ labels: newLabels })
            }}
            onScheduledClick={() => openOverlay('scheduled')}
            onDeadlineClick={() => openOverlay('deadline')}
            onAssigneeClick={() => openOverlay('assignee')}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">⌘</kbd>+<kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Enter</kbd> to create
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!tempTask.content.trim() || isCreating}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-2xl">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-2">Discard changes?</h3>
              <p className="text-gray-600 mb-4">
                You have unsaved changes. Are you sure you want to close without creating the task?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Keep editing
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}