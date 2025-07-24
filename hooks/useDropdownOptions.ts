import { useMemo } from 'react'
import { DropdownOption, SortOption } from '@/types/dropdown'
import { TodoistTask } from '@/lib/types'
import { isExcludedLabel } from '@/lib/excluded-labels'

/**
 * Base hook for dropdown options with common functionality
 */
export interface UseDropdownOptionsProps {
  tasks: TodoistTask[]
  excludeArchived?: boolean
  sortBy?: string
  sortOptions?: Record<string, SortOption>
}

/**
 * Calculate task count for a filter function
 */
export function calculateTaskCount(
  tasks: TodoistTask[],
  filterFn: (task: TodoistTask) => boolean,
  excludeArchived = true
): number {
  return tasks.filter(task => {
    // Always exclude archived tasks (those starting with "* ")
    if (excludeArchived && task.content.startsWith('* ')) {
      return false
    }
    // Exclude tasks with excluded labels (matching filterTasksByMode behavior)
    if (task.labels.some(label => isExcludedLabel(label))) {
      return false
    }
    return filterFn(task)
  }).length
}

/**
 * Sort options based on sort configuration
 */
export function sortOptions(
  options: DropdownOption[],
  sortBy: string | undefined,
  sortOptions: Record<string, SortOption> | undefined
): DropdownOption[] {
  if (!sortBy || sortBy === 'default' || !sortOptions) {
    return options
  }

  const sortOption = sortOptions[sortBy]
  if (!sortOption) {
    console.warn(`Sort option "${sortBy}" not found`)
    return options
  }

  // Create a copy and sort
  return [...options].sort(sortOption.sortFn)
}

/**
 * Filter out empty options if hideEmpty is true
 */
export function filterEmptyOptions(
  options: DropdownOption[],
  hideEmpty: boolean
): DropdownOption[] {
  if (!hideEmpty) return options
  
  return options.filter(option => (option.count || 0) > 0)
}

/**
 * Base hook that provides common functionality for all dropdown option hooks
 */
export function useDropdownOptions({
  tasks,
  excludeArchived = true,
  sortBy,
  sortOptions: sortOpts
}: UseDropdownOptionsProps) {
  return useMemo(() => {
    return {
      calculateCount: (filterFn: (task: TodoistTask) => boolean) => 
        calculateTaskCount(tasks, filterFn, excludeArchived),
      sortOptions: (options: DropdownOption[]) => 
        sortOptions(options, sortBy, sortOpts),
      filterEmpty: (options: DropdownOption[], hideEmpty: boolean) =>
        filterEmptyOptions(options, hideEmpty)
    }
  }, [tasks, excludeArchived, sortBy, sortOpts])
}