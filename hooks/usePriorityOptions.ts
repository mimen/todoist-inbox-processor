import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistTask } from '@/lib/types'
import { ModeConfig } from '@/types/queue'
import { PRIORITY_OPTIONS } from '@/constants/priority-options'
import { useDropdownOptions } from './useDropdownOptions'

/**
 * Hook to convert priority levels to dropdown options
 * Always returns exactly 4 options (P1-P4)
 */
export function usePriorityOptions(
  tasks: TodoistTask[],
  config?: ModeConfig
): DropdownOption[] {
  const { calculateCount, filterEmpty } = useDropdownOptions({ tasks })

  return useMemo(() => {
    // Calculate counts for each priority
    const optionsWithCounts = PRIORITY_OPTIONS.map(priorityOption => ({
      ...priorityOption,
      count: calculateCount(task => task.priority === Number(priorityOption.id))
    }))

    // Filter empty if configured
    return filterEmpty(optionsWithCounts, config?.hideEmpty || false)
  }, [tasks, config, calculateCount, filterEmpty])
}