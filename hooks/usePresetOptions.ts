import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistTask } from '@/lib/types'
import { ModeConfig } from '@/types/queue'
import { PRESET_FILTERS } from '@/types/processing-mode'
import { useDropdownOptions } from './useDropdownOptions'

/**
 * Hook to convert preset filters to dropdown options
 */
export function usePresetOptions(
  tasks: TodoistTask[],
  projectMetadata: Record<string, any>,
  config?: ModeConfig
): DropdownOption[] {
  const { calculateCount, filterEmpty } = useDropdownOptions({ tasks })

  return useMemo(() => {
    // Calculate counts for each preset
    const optionsWithCounts = PRESET_FILTERS.map(preset => ({
      id: preset.id,
      label: preset.name,
      type: 'preset' as const,
      icon: preset.icon,
      description: preset.description,
      count: calculateCount(task => {
        try {
          return preset.filter(task, projectMetadata)
        } catch (error) {
          console.error(`Error applying preset filter ${preset.id}:`, error)
          return false
        }
      }),
      metadata: { preset }
    }))

    // Filter empty if configured
    return filterEmpty(optionsWithCounts, config?.hideEmpty || false)
  }, [tasks, projectMetadata, config, calculateCount, filterEmpty])
}