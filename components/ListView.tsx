'use client'

import React from 'react'
import { TodoistTask, TodoistProject, TodoistLabel } from '@/lib/types'
import { ProcessingMode } from '@/types/processing-mode'
import { ListViewState } from '@/types/view-mode'
import ListViewComponent from './ListView/ListView'

interface ListViewProps {
  // Data
  allTasks: TodoistTask[]
  allTasksGlobal: TodoistTask[]
  taskCounts: Record<string, number>
  projects: TodoistProject[]
  labels: TodoistLabel[]
  projectMetadata: Record<string, any>
  
  // State
  processingMode: ProcessingMode
  listViewState: ListViewState
  multiListMode: boolean
  prioritizedModeOptions?: any[]
  
  // Actions
  onListViewStateChange: (updates: Partial<ListViewState>) => void
  onTaskUpdate: (taskId: string, updates: Partial<TodoistTask>) => void
  onTaskProcess: (taskId: string) => void
  onOpenOverlay: (type: string, taskId?: string) => void
  onToggleEditMode: (taskId: string | null) => void
  onMarkTaskComplete: (taskId: string) => void
  
  // Queue management
  activeQueue: string[]
  processedTaskIds: string[]
}

export default function ListView({
  allTasks,
  allTasksGlobal,
  taskCounts,
  projects,
  labels,
  projectMetadata,
  processingMode,
  listViewState,
  multiListMode,
  prioritizedModeOptions,
  onListViewStateChange,
  onTaskUpdate,
  onTaskProcess,
  onOpenOverlay,
  onToggleEditMode,
  onMarkTaskComplete,
  activeQueue,
  processedTaskIds
}: ListViewProps) {
  // The onTaskUpdate prop already handles auto-saving
  const handleTaskUpdate = async (taskId: string, updates: Partial<TodoistTask>) => {
    // This already includes auto-save functionality
    onTaskUpdate(taskId, updates)
  }
  
  // Map the overlay handler to individual overlay handlers expected by ListViewComponent
  const handleOpenOverlay = (type: string, taskId?: string) => {
    if (!taskId) return
    
    switch (type) {
      case 'project':
        onOpenOverlay('project', taskId)
        break
      case 'priority':
        onOpenOverlay('priority', taskId)
        break
      case 'label':
        onOpenOverlay('label', taskId)
        break
      case 'scheduled':
        onOpenOverlay('scheduled', taskId)
        break
      case 'deadline':
        onOpenOverlay('deadline', taskId)
        break
      case 'assignee':
        onOpenOverlay('assignee', taskId)
        break
      case 'complete':
        onOpenOverlay('complete', taskId)
        break
    }
  }
  
  return (
    <ListViewComponent
      tasks={allTasks}
      projects={projects}
      labels={labels}
      processingMode={processingMode}
      projectMetadata={projectMetadata}
      listViewState={listViewState}
      slidingOutTaskIds={processedTaskIds}
      onListViewStateChange={onListViewStateChange}
      onTaskUpdate={handleTaskUpdate}
      onTaskComplete={onMarkTaskComplete}
      onTaskProcess={onTaskProcess}
      onTaskDelete={(taskId) => onTaskUpdate(taskId, { isDeleted: true })}
      onViewModeChange={() => {}}
      currentUserId="13801296"
      onOpenProjectOverlay={(taskId) => handleOpenOverlay('project', taskId)}
      onOpenPriorityOverlay={(taskId) => handleOpenOverlay('priority', taskId)}
      onOpenLabelOverlay={(taskId) => handleOpenOverlay('label', taskId)}
      onOpenScheduledOverlay={(taskId) => handleOpenOverlay('scheduled', taskId)}
      onOpenDeadlineOverlay={(taskId) => handleOpenOverlay('deadline', taskId)}
      onOpenAssigneeOverlay={(taskId) => handleOpenOverlay('assignee', taskId)}
    />
  )
}