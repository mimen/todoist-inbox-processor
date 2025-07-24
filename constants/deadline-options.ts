import { DropdownOption } from '@/types/dropdown'

/**
 * Fixed deadline range options for deadline filtering
 */
export const DEADLINE_OPTIONS: DropdownOption[] = [
  {
    id: 'overdue',
    type: 'deadline',
    label: 'Overdue',
    icon: '🚨',
    iconColor: 'red'
  },
  {
    id: 'today',
    type: 'deadline',
    label: 'Today',
    icon: '🎯',
    iconColor: 'green'
  },
  {
    id: 'tomorrow',
    type: 'deadline',
    label: 'Tomorrow',
    icon: '📍',
    iconColor: 'orange'
  },
  {
    id: 'this_week',
    type: 'deadline',
    label: 'This Week',
    icon: '📌',
    iconColor: 'blue'
  },
  {
    id: 'this_month',
    type: 'deadline',
    label: 'This Month',
    icon: '🗓️',
    iconColor: 'purple'
  }
]

/**
 * Get a deadline option by ID
 */
export function getDeadlineOption(id: string): DropdownOption | undefined {
  return DEADLINE_OPTIONS.find(option => option.id === id)
}