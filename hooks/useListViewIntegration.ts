import { useEffect, useCallback } from 'react'
import { useFocusedTask } from '@/contexts/FocusedTaskContext'
import { ProcessingMode } from '@/types/processing-mode'
import { TodoistTask } from '@/lib/types'

interface UseListViewIntegrationProps {
  highlightedTaskId: string | null
  tasks: Record<string, TodoistTask>
  processingMode: ProcessingMode
  viewMode: 'processing' | 'list'
  listId?: string // For multi-list mode
}

export function useListViewIntegration({
  highlightedTaskId,
  tasks,
  processingMode,
  viewMode,
  listId
}: UseListViewIntegrationProps) {
  const { focusedTaskId, setFocusedTask } = useFocusedTask()
  
  // Sync highlighted task with focused task
  useEffect(() => {
    if (viewMode === 'list' && highlightedTaskId && tasks[highlightedTaskId]) {
      const task = tasks[highlightedTaskId]
      setFocusedTask(highlightedTaskId, task, {
        processingMode,
        listId
      })
    } else {
    }
  }, [highlightedTaskId, tasks, processingMode, viewMode, listId, setFocusedTask, focusedTaskId])
  
  // When switching to list view, restore focus to the previously focused task
  const restoreListFocus = useCallback(() => {
    if (focusedTaskId && viewMode === 'list') {
      // Find the list item element and focus it
      const listItem = document.querySelector(`[data-task-id="${focusedTaskId}"]`) as HTMLElement
      if (listItem) {
        listItem.focus()
        listItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [focusedTaskId, viewMode])
  
  // Use this when switching views
  useEffect(() => {
    if (viewMode === 'list') {
      // Small delay to ensure DOM is ready
      setTimeout(restoreListFocus, 100)
    }
  }, [viewMode, restoreListFocus])
  
  return {
    focusedTaskId,
    restoreListFocus
  }
}