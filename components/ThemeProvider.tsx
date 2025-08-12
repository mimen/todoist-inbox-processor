'use client'

import React, { useEffect } from 'react'
import { useSettingsContext } from '@/contexts/SettingsContext'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, isLoading } = useSettingsContext()
  
  // Apply theme on initial mount and when settings change
  useEffect(() => {
    // Don't apply theme until settings are loaded
    if (isLoading) return
    
    const applyTheme = () => {
      const root = window.document.documentElement
      const theme = settings.general?.theme || 'system'
      
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark')
      
      if (theme === 'system') {
        // Use system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        root.classList.add(systemTheme)
      } else {
        // Use explicit theme
        root.classList.add(theme)
      }
      
    }
    
    // Apply immediately
    applyTheme()
    
    // Also apply on next tick to ensure it overrides any other changes
    setTimeout(applyTheme, 0)
  }, [settings.general?.theme, isLoading])
  
  // Listen for system theme changes when using system preference
  useEffect(() => {
    if (settings.general?.theme !== 'system') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [settings.general.theme])
  
  return <>{children}</>
}