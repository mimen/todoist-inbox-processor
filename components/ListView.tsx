'use client'

import React from 'react'
import { TodoistTask, TodoistProject, TodoistLabel } from '@/lib/types'
import { ProcessingMode } from '@/types/processing-mode'
import { ListViewState } from '@/types/view-mode'
import { useQueueConfig } from '@/hooks/useQueueConfig'
import UnifiedListView from './ListView/UnifiedListView'

interface ListViewProps {
  // Data
  allTasks: TodoistTask[]
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
  onMarkTaskComplete: (taskId: string) => void
  
  // UI State
  processedTaskIds: string[]
  
  // User context
  currentUserId: string
}

export default function ListView({
  allTasks,
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
  onMarkTaskComplete,
  processedTaskIds,
  currentUserId
}: ListViewProps) {
  const config = useQueueConfig()
  
  // The onTaskUpdate prop already handles auto-saving
  const handleTaskUpdate = async (taskId: string, updates: Partial<TodoistTask>) => {
    // This already includes auto-save functionality
    onTaskUpdate(taskId, updates)
  }
  
  // Convert multiListMode boolean to viewMode
  const viewMode = multiListMode ? 'multi' : 'single'
  
  // Use prioritized sequence from config if processingMode is prioritized and multiListMode is on
  const prioritizedSequence = (processingMode.type === 'prioritized' && multiListMode && config.prioritizedQueue?.enabled) 
    ? config.prioritizedQueue.sequence 
    : prioritizedModeOptions
  
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
      prioritizedSequence={prioritizedSequence}
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
      currentUserId={currentUserId}
      onOpenOverlay={handleOpenOverlay}
    />
  )
}
