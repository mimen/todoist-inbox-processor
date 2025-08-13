'use client'

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { TodoistTask } from '@/lib/types'
import { ProcessingMode } from '@/types/processing-mode'

interface FocusedTaskContextValue {
  // Core focused task state
  focusedTaskId: string | null
  focusedTask: TodoistTask | null
  
  // Queue/list context to restore when switching views
  focusedTaskQueue: {
    processingMode: ProcessingMode
    queuePosition?: number
    listId?: string // For multi-list mode
  } | null
  
  // Methods
  setFocusedTask: (taskId: string | null, task: TodoistTask | null, queueContext?: FocusedTaskContextValue['focusedTaskQueue']) => void
  clearFocusedTask: () => void
  
  // Focus management for overlays
  lastFocusedElement: HTMLElement | null
  setLastFocusedElement: (element: HTMLElement | null) => void
  restoreFocus: () => void
}

const FocusedTaskContext = createContext<FocusedTaskContextValue | undefined>(undefined)

export function FocusedTaskProvider({ children }: { children: ReactNode }) {
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null)
  const [focusedTask, setFocusedTaskState] = useState<TodoistTask | null>(null)
  const [focusedTaskQueue, setFocusedTaskQueue] = useState<FocusedTaskContextValue['focusedTaskQueue']>(null)
  const lastFocusedElementRef = useRef<HTMLElement | null>(null)

  const setFocusedTask = useCallback((
    taskId: string | null, 
    task: TodoistTask | null,
    queueContext?: FocusedTaskContextValue['focusedTaskQueue']
  ) => {
    setFocusedTaskId(taskId)
    setFocusedTaskState(task)
    
    // Update queue context if provided
    if (queueContext) {
      setFocusedTaskQueue(queueContext)
    }
  }, [])

  const clearFocusedTask = useCallback(() => {
    setFocusedTaskId(null)
    setFocusedTaskState(null)
    // Keep queue context for potential restoration
  }, [])

  const setLastFocusedElement = useCallback((element: HTMLElement | null) => {
    lastFocusedElementRef.current = element
  }, [])

  const restoreFocus = useCallback(() => {
    // In list view, we don't need to restore browser focus
    // The highlighted task acts as our persistent cursor
    // For processing view, restore focus to the form
    const taskForm = document.querySelector('[data-task-form]') as HTMLElement
    if (taskForm) {
      taskForm.focus()
    }
  }, [])

  const value: FocusedTaskContextValue = {
    focusedTaskId,
    focusedTask,
    focusedTaskQueue,
    setFocusedTask,
    clearFocusedTask,
    lastFocusedElement: lastFocusedElementRef.current,
    setLastFocusedElement,
    restoreFocus
  }

  return (
    <FocusedTaskContext.Provider value={value}>
      {children}
    </FocusedTaskContext.Provider>
  )
}

export function useFocusedTask() {
  const context = useContext(FocusedTaskContext)
  if (context === undefined) {
    throw new Error('useFocusedTask must be used within a FocusedTaskProvider')
  }
  return context
}