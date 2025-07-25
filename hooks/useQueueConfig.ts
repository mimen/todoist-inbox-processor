import { useState, useEffect } from 'react'
import { QueueConfiguration } from '@/types/queue'
import { DEFAULT_QUEUE_CONFIG } from '@/constants/queue-config'

/**
 * Validates queue configuration structure and values
 */
function validateQueueConfig(config: any): { isValid: boolean; errors: string[]; validConfig?: QueueConfiguration } {
  const errors: string[] = []
  
  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be an object')
    return { isValid: false, errors }
  }
  
  if (!config.standardModes || typeof config.standardModes !== 'object') {
    errors.push('Missing or invalid standardModes configuration')
  } else {
    // Validate each standard mode
    const validModes = ['project', 'priority', 'label', 'date', 'deadline', 'preset', 'all', 'filter', 'assignee', 'prioritized']
    
    for (const [mode, modeConfig] of Object.entries(config.standardModes)) {
      if (!validModes.includes(mode)) {
        errors.push(`Unknown mode: ${mode}`)
        continue
      }
      
      if (modeConfig && typeof modeConfig === 'object') {
        const mc = modeConfig as any
        
        // Validate multiSelect
        if (mc.multiSelect !== undefined && typeof mc.multiSelect !== 'boolean') {
          errors.push(`Invalid multiSelect value for ${mode}: must be boolean`)
        }
        
        // Validate sortBy
        if (mc.sortBy !== undefined && typeof mc.sortBy !== 'string') {
          errors.push(`Invalid sortBy value for ${mode}: must be string`)
        }
        
        // Validate sortDirection
        if (mc.sortDirection !== undefined) {
          if (typeof mc.sortDirection !== 'string' || !['asc', 'desc'].includes(mc.sortDirection)) {
            errors.push(`Invalid sortDirection value for ${mode}: must be 'asc' or 'desc'`)
          }
        }
        
        // Validate hideEmpty
        if (mc.hideEmpty !== undefined && typeof mc.hideEmpty !== 'boolean') {
          errors.push(`Invalid hideEmpty value for ${mode}: must be boolean`)
        }
      }
    }
  }
  
  if (errors.length === 0) {
    return { isValid: true, errors: [], validConfig: config as QueueConfiguration }
  }
  
  return { isValid: false, errors }
}

/**
 * Hook to load queue configuration from JSON file
 * Falls back to default config if file can't be loaded
 */
export function useQueueConfig(): QueueConfiguration {
  const [config, setConfig] = useState<QueueConfiguration>(DEFAULT_QUEUE_CONFIG)

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/config/queue-config.json')
        if (response.ok) {
          const jsonConfig = await response.json()
          const validation = validateQueueConfig(jsonConfig)
          
          if (validation.isValid && validation.validConfig) {
            setConfig(validation.validConfig)
            console.log('Queue configuration loaded:', validation.validConfig)
          } else {
            console.error('Invalid queue configuration:', validation.errors.join(', '))
            console.warn('Using default configuration')
          }
        }
      } catch (error) {
        console.warn('Failed to load queue config from JSON, using defaults', error)
      }
    }

    // Load config once on mount
    loadConfig()
  }, [])

  return config
}