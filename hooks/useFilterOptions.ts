import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistTask } from '@/lib/types'
import { ModeConfig } from '@/types/queue'

export interface TodoistFilter {
  id: string;
  name: string;
  query: string;
  color?: string;
  is_favorite?: boolean;
}

/**
 * Hook to convert Todoist filters to DropdownOption format
 */
export function useFilterOptions(
  filters: TodoistFilter[],
  tasks: TodoistTask[],
  config?: ModeConfig
): DropdownOption[] {
  return useMemo(() => {
    if (!filters || filters.length === 0) {
      return []
    }

    const options: DropdownOption[] = filters.map(filter => ({
      id: filter.id,
      label: filter.name,
      value: filter.id,
      type: 'filter' as any,
      icon: 'Sparkles', // Filter icon
      count: 0, // TODO: Could calculate tasks matching filter query
      metadata: {
        query: filter.query,
        color: filter.color,
        isFavorite: filter.is_favorite
      }
    }))

    // Sort by favorite first, then by name
    return options.sort((a, b) => {
      if (a.metadata?.isFavorite && !b.metadata?.isFavorite) return -1
      if (!a.metadata?.isFavorite && b.metadata?.isFavorite) return 1
      return a.label.localeCompare(b.label)
    })
  }, [filters, tasks, config])
}