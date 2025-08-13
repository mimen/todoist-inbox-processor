'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type OverlayType = 'priority' | 'project' | 'label' | 'scheduled' | 'deadline' | 'assignee' | 'complete'

interface OverlayState {
  priority: boolean
  project: boolean
  label: boolean
  scheduled: boolean
  deadline: boolean
  assignee: boolean
  complete: boolean
}

const initialOverlayState: OverlayState = {
  priority: false,
  project: false,
  label: false,
  scheduled: false,
  deadline: false,
  assignee: false,
  complete: false
}

interface OverlayContextValue {
  overlays: OverlayState
  isAnyOverlayOpen: boolean
  openOverlay: (type: OverlayType) => void
  closeOverlay: (type: OverlayType) => void
  closeAllOverlays: () => void
  isOverlayOpen: (type: OverlayType) => boolean
}

const OverlayContext = createContext<OverlayContextValue | null>(null)

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [overlays, setOverlays] = useState<OverlayState>(initialOverlayState)
  
  // Track if any overlay is open
  const isAnyOverlayOpen = Object.values(overlays).some(isOpen => isOpen)

  const openOverlay = useCallback((type: OverlayType) => {
    setOverlays(prev => ({ ...prev, [type]: true }))
  }, [])

  const closeOverlay = useCallback((type: OverlayType) => {
    setOverlays(prev => ({ ...prev, [type]: false }))
  }, [])

  const closeAllOverlays = useCallback(() => {
    setOverlays(initialOverlayState)
  }, [])

  // Helper to check if a specific overlay is open
  const isOverlayOpen = useCallback((type: OverlayType) => {
    return overlays[type]
  }, [overlays])

  const value: OverlayContextValue = {
    overlays,
    isAnyOverlayOpen,
    openOverlay,
    closeOverlay,
    closeAllOverlays,
    isOverlayOpen
  }

  return (
    <OverlayContext.Provider value={value}>
      {children}
    </OverlayContext.Provider>
  )
}

export function useOverlayContext() {
  const context = useContext(OverlayContext)
  if (!context) {
    throw new Error('useOverlayContext must be used within an OverlayProvider')
  }
  return context
}