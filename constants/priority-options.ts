import { DropdownOption } from '@/types/dropdown'

/**
 * Fixed priority level options
 * Todoist uses 1-4 internally, but displays as P4-P1
 */
export const PRIORITY_OPTIONS: DropdownOption[] = [
  {
    id: '4',
    type: 'priority',
    label: 'P1',
    icon: '🔴', // Will be replaced by PriorityFlag component
    metadata: { priority: 4 }
  },
  {
    id: '3',
    type: 'priority',
    label: 'P2',
    icon: '🟠', // Will be replaced by PriorityFlag component
    metadata: { priority: 3 }
  },
  {
    id: '2',
    type: 'priority',
    label: 'P3',
    icon: '🔵', // Will be replaced by PriorityFlag component
    metadata: { priority: 2 }
  },
  {
    id: '1',
    type: 'priority',
    label: 'P4',
    icon: '⚪', // Will be replaced by PriorityFlag component
    metadata: { priority: 1 }
  }
]

/**
 * Get a priority option by ID
 */
export function getPriorityOption(id: string): DropdownOption | undefined {
  return PRIORITY_OPTIONS.find(option => option.id === id)
}

/**
 * Get UI priority label (P1-P4) from API priority (1-4)
 */
export function getUIPriority(apiPriority: number): string {
  return `P${5 - apiPriority}`
}