import { DropdownOption } from '@/types/dropdown'

/**
 * Fixed date range options for scheduled date filtering
 */
export const DATE_OPTIONS: DropdownOption[] = [
  {
    id: 'overdue',
    type: 'date',
    label: 'Overdue',
    icon: '⏰',
    iconColor: 'red'
  },
  {
    id: 'today',
    type: 'date',
    label: 'Today',
    icon: '📅',
    iconColor: 'green'
  },
  {
    id: 'tomorrow',
    type: 'date',
    label: 'Tomorrow',
    icon: '☀️',
    iconColor: 'orange'
  },
  {
    id: 'next_7_days',
    type: 'date',
    label: 'Next 7 Days',
    icon: '📆',
    iconColor: 'blue'
  },
  {
    id: 'future',
    type: 'date',
    label: 'Future',
    icon: '🔮',
    iconColor: 'purple'
  },
  {
    id: 'recurring',
    type: 'date',
    label: 'Recurring',
    icon: '🔄',
    iconColor: 'gray'
  }
]

/**
 * Get a date option by ID
 */
export function getDateOption(id: string): DropdownOption | undefined {
  return DATE_OPTIONS.find(option => option.id === id)
}