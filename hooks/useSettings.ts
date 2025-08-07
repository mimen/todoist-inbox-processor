import { useState, useEffect, useCallback } from 'react'
import { AppSettings, DEFAULT_SETTINGS } from '@/types/settings'

const SETTINGS_KEY = 'todoist-inbox-processor-settings'

/**
 * Hook to manage app settings with localStorage persistence
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to ensure all settings exist
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          listView: {
            ...DEFAULT_SETTINGS.listView,
            ...(parsed.listView || {})
          }
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      } catch (error) {
        console.error('Failed to save settings:', error)
      }
    }
  }, [settings, isLoading])

  // Update a specific setting
  const updateSetting = useCallback(<K extends keyof AppSettings>(
    category: K,
    key: keyof AppSettings[K],
    value: AppSettings[K][keyof AppSettings[K]]
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }, [])

  // Toggle a boolean setting
  const toggleSetting = useCallback(<K extends keyof AppSettings>(
    category: K,
    key: keyof AppSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !(prev[category][key] as boolean)
      }
    }))
  }, [])

  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return {
    settings,
    updateSetting,
    toggleSetting,
    resetSettings,
    isLoading
  }
}