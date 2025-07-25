import { ProcessingModeType } from '@/types/processing-mode'

export interface SortOption {
  value: string
  label: string
  direction: 'asc' | 'desc'
}

/**
 * Available sort options for each dropdown type
 */
type ExtendedDropdownType = ProcessingModeType | 'filter' | 'assignee'

export const DROPDOWN_SORT_OPTIONS: Record<ExtendedDropdownType, SortOption[]> = {
  project: [
    { value: 'hierarchy', label: 'Hierarchy', direction: 'asc' },
    { value: 'count', label: 'Most Tasks', direction: 'desc' },
    { value: 'count', label: 'Least Tasks', direction: 'asc' },
    { value: 'name', label: 'Name A-Z', direction: 'asc' },
    { value: 'name', label: 'Name Z-A', direction: 'desc' }
  ],
  
  priority: [],
  
  label: [
    { value: 'default', label: 'Default', direction: 'asc' },
    { value: 'count', label: 'Most Tasks', direction: 'desc' },
    { value: 'count', label: 'Least Tasks', direction: 'asc' },
    { value: 'name', label: 'Name A-Z', direction: 'asc' },
    { value: 'name', label: 'Name Z-A', direction: 'desc' }
  ],
  
  date: [
    { value: 'date', label: 'Default', direction: 'asc' },
    { value: 'count', label: 'Most Tasks', direction: 'desc' },
    { value: 'count', label: 'Least Tasks', direction: 'asc' }
  ],
  
  deadline: [
    { value: 'date', label: 'Default', direction: 'asc' },
    { value: 'count', label: 'Most Tasks', direction: 'desc' },
    { value: 'count', label: 'Least Tasks', direction: 'asc' }
  ],
  
  preset: [
    { value: 'default', label: 'Default', direction: 'asc' },
    { value: 'count', label: 'Most Tasks', direction: 'desc' },
    { value: 'count', label: 'Least Tasks', direction: 'asc' }
  ],
  
  filter: [
    { value: 'name', label: 'Name A-Z', direction: 'asc' },
    { value: 'name', label: 'Name Z-A', direction: 'desc' }
  ],
  
  assignee: [
    { value: 'name', label: 'Name A-Z', direction: 'asc' },
    { value: 'name', label: 'Name Z-A', direction: 'desc' }
  ],
  
  all: []
}

/**
 * Get the default sort option for a dropdown type
 */
export function getDefaultSortOption(type: ExtendedDropdownType): SortOption {
  const options = DROPDOWN_SORT_OPTIONS[type]
  return options?.[0] || { value: 'name', label: 'Name A-Z', direction: 'asc' }
}