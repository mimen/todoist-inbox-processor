import { DropdownOption } from '@/types/dropdown'
import { ModeConfig } from '@/types/queue'

/**
 * Sort dropdown options based on configuration
 */
export function sortDropdownOptions(
  options: DropdownOption[],
  config?: ModeConfig,
  defaultSort: string = 'name'
): DropdownOption[] {
  if (!config || !config.sortBy) {
    config = { sortBy: defaultSort, sortDirection: 'asc' }
  }

  const sortBy = config.sortBy || defaultSort
  const sortDirection = config.sortDirection || 'asc'
  
  // Create a copy to avoid mutating original array
  const sorted = [...options]
  
  // Define sort comparators
  const comparators: Record<string, (a: DropdownOption, b: DropdownOption) => number> = {
    name: (a, b) => {
      const aName = (a.label || '').toLowerCase()
      const bName = (b.label || '').toLowerCase()
      return aName.localeCompare(bName)
    },
    
    count: (a, b) => {
      const aCount = a.count || 0
      const bCount = b.count || 0
      return aCount - bCount // Default comparison, will be reversed if desc
    },
    
    priority: (a, b) => {
      // For priority sorting, use the id which contains the priority level
      const aPriority = parseInt(a.id, 10) || 0
      const bPriority = parseInt(b.id, 10) || 0
      return aPriority - bPriority // Higher priority (4) first
    },
    
    'project-priority': (a, b) => {
      // For project priority sorting, get priority from metadata
      // P1 = 4, P2 = 3, P3 = 2, P4 = 1
      const aPriority = a.metadata?.priority || 0
      const bPriority = b.metadata?.priority || 0
      return aPriority - bPriority // Higher priority (4) first
    },
    
    date: (a, b) => {
      // For date range sorting, use a predefined order
      const dateOrder = ['overdue', 'today', 'tomorrow', 'next_7_days', 'future', 'recurring']
      const aIndex = dateOrder.indexOf(a.id)
      const bIndex = dateOrder.indexOf(b.id)
      
      // If not found in order, put at the end
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      
      return aIndex - bIndex
    },
    
    hierarchy: (a, b) => {
      // For hierarchical sorting (projects), respect parent-child relationships
      // This assumes hierarchical data has already been properly ordered
      // Just return 0 to maintain existing order
      return 0
    },
    
    default: (a, b) => 0 // Maintain original order
  }
  
  // Apply sorting
  const comparator = comparators[sortBy] || comparators.name
  sorted.sort((a, b) => {
    const result = comparator(a, b)
    // Reverse if descending
    return sortDirection === 'desc' ? -result : result
  })
  
  // Handle special cases
  if (sortBy === 'count' && sortDirection === 'asc') {
    // For count, ascending typically means "least tasks first"
    // which is already handled by reversing the comparator
  }
  
  if (sortBy === 'hierarchy') {
    // Don't re-sort hierarchical data, it's already structured
    return options
  }
  
  return sorted
}

/**
 * Get default sort configuration for a given dropdown type
 */
export function getDefaultSort(type: string): { sortBy: string; sortDirection: 'asc' | 'desc' } {
  const defaults: Record<string, { sortBy: string; sortDirection: 'asc' | 'desc' }> = {
    project: { sortBy: 'hierarchy', sortDirection: 'asc' },
    priority: { sortBy: 'priority', sortDirection: 'desc' },
    label: { sortBy: 'count', sortDirection: 'desc' },
    date: { sortBy: 'date', sortDirection: 'asc' },
    deadline: { sortBy: 'date', sortDirection: 'asc' },
    preset: { sortBy: 'name', sortDirection: 'asc' },
    all: { sortBy: 'count', sortDirection: 'desc' },
    filter: { sortBy: 'name', sortDirection: 'asc' },
    assignee: { sortBy: 'name', sortDirection: 'asc' }
  }
  
  return defaults[type] || { sortBy: 'name', sortDirection: 'asc' }
}