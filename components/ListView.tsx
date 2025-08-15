'use client'

import React from 'react'
import { TodoistTask, TodoistProject, TodoistLabel, TaskUpdate } from '@/lib/types'
import { ProcessingMode } from '@/types/processing-mode'
import { ListViewState } from '@/types/view-mode'
import UnifiedListView from './ListView/UnifiedListView'

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
  const handleTaskUpdate = async (taskId: string, updates: TaskUpdate) => {
    // This already includes auto-save functionality
    onTaskUpdate(taskId, updates as Partial<TodoistTask>)
  }
  
  // Convert multiListMode boolean to viewMode
  const viewMode = multiListMode ? 'multi' : 'single'
  
  // Handle overlay with unified handler
  const handleOpenOverlay = (type: string, taskId: string) => {
    onOpenOverlay(type, taskId)
  }
  
  return (
    <UnifiedListView
      allTasks={allTasks}
      projects={projects}
      labels={labels}
      projectMetadata={projectMetadata}
      viewMode={viewMode}
      processingMode={processingMode}
      prioritizedSequence={prioritizedModeOptions}
      visibleListCount={3}
      listViewState={listViewState}
      slidingOutTaskIds={processedTaskIds}
      onListViewStateChange={onListViewStateChange}
      onTaskUpdate={handleTaskUpdate}
      onTaskComplete={onMarkTaskComplete}
      onTaskProcess={onTaskProcess}
      onTaskDelete={(taskId) => {
        // Handle task deletion - could either update a status or call a separate delete function
        // For now, we'll just call onTaskProcess which handles task removal from the view
        onTaskProcess(taskId)
      }}
      onViewModeChange={() => {}}
      currentUserId="13801296"
      onOpenOverlay={handleOpenOverlay}
    />
  )
}