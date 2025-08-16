'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface NewTaskContextValue {
  isNewTaskOpen: boolean
  openNewTask: () => void
  closeNewTask: () => void
}

const NewTaskContext = createContext<NewTaskContextValue | null>(null)

export function NewTaskProvider({ children }: { children: ReactNode }) {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)

  const openNewTask = useCallback(() => {
    setIsNewTaskOpen(true)
  }, [])

  const closeNewTask = useCallback(() => {
    setIsNewTaskOpen(false)
  }, [])

  const value: NewTaskContextValue = {
    isNewTaskOpen,
    openNewTask,
    closeNewTask,
  }

  return (
    <NewTaskContext.Provider value={value}>
      {children}
    </NewTaskContext.Provider>
  )
}

export function useNewTaskContext() {
  const context = useContext(NewTaskContext)
  if (!context) {
    throw new Error('useNewTaskContext must be used within a NewTaskProvider')
  }
  return context
}