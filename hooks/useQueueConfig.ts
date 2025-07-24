import { useState, useEffect } from 'react'
import { QueueConfiguration } from '@/types/queue'
import { DEFAULT_QUEUE_CONFIG } from '@/constants/queue-config'

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
          setConfig(jsonConfig)
        }
      } catch (error) {
        console.warn('Failed to load queue config from JSON, using defaults', error)
      }
    }

    loadConfig()
  }, [])

  return config
}