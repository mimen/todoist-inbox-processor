import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistTask } from '@/lib/types'
import { ModeConfig } from '@/types/queue'
import { SORT_OPTIONS } from '@/types/processing-mode'

/**
 * Hook to convert sort options to dropdown options for "All" mode
 * This mode shows all tasks with different sorting options
 */
export function useAllOptions(
  tasks: TodoistTask[],
  config?: ModeConfig
): DropdownOption[] {
  return useMemo(() => {
    // For "All" mode, we show sort options, not filtered views
    // Each option shows the same total count but with different sorting
    const totalCount = tasks.filter(task => !task.content.startsWith('* ')).length

    return SORT_OPTIONS.map(sortOption => ({
      id: sortOption.value,
      label: sortOption.label,
      type: 'all' as const,
      icon: '📊',
      description: sortOption.description,
      count: totalCount, // Same count for all sort options
      metadata: { sortOption }
    }))
  }, [tasks])
}