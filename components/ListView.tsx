'use client'

import React from 'react'
import { TodoistTask, TodoistProject, TodoistLabel } from '@/lib/types'
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
  const handleTaskUpdate = async (taskId: string, updates: Partial<TodoistTask>) => {
    // This already includes auto-save functionality
    onTaskUpdate(taskId, updates)
  }
  
  return (
    <UnifiedListView
      allTasks={allTasks}
      allTasksGlobal={allTasksGlobal}
      taskCounts={taskCounts}
      labels={labels}
      projectMetadata={projectMetadata}
      activeQueue={activeQueue}
      processedTaskIds={processedTaskIds}
      processingMode={processingMode}
      listViewState={listViewState}
      multiListMode={multiListMode}
      prioritizedModeOptions={prioritizedModeOptions}
      onListViewStateChange={onListViewStateChange}
      onTaskUpdate={handleTaskUpdate}
      onTaskProcess={onTaskProcess}
      onOpenOverlay={onOpenOverlay}
      onToggleEditMode={onToggleEditMode}
      onMarkTaskComplete={onMarkTaskComplete}
    />
  )
}