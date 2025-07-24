import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistTask } from '@/lib/types'
import { ModeConfig } from '@/types/queue'
import { DATE_OPTIONS } from '@/constants/date-options'
import { useDropdownOptions } from './useDropdownOptions'

/**
 * Get local date string in YYYY-MM-DD format
 */
function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Check if a date is overdue
 */
function isOverdue(dateString: string): boolean {
  const dateOnly = dateString.split('T')[0]
  const today = new Date()
  const todayStr = getLocalDateString(today)
  return dateOnly < todayStr
}

/**
 * Check if a date is today
 */
function isToday(dateString: string): boolean {
  const dateOnly = dateString.split('T')[0]
  const today = new Date()
  const todayStr = getLocalDateString(today)
  return dateOnly === todayStr
}

/**
 * Check if a date is tomorrow
 */
function isTomorrow(dateString: string): boolean {
  const dateOnly = dateString.split('T')[0]
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = getLocalDateString(tomorrow)
  return dateOnly === tomorrowStr
}

/**
 * Check if a date is within next 7 days (including today)
 */
function isNext7Days(dateString: string): boolean {
  const dateOnly = dateString.split('T')[0]
  const today = new Date()
  const todayStr = getLocalDateString(today)
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)
  const nextWeekStr = getLocalDateString(nextWeek)
  
  return dateOnly >= todayStr && dateOnly <= nextWeekStr
}

/**
 * Check if a date is future (beyond 7 days)
 */
function isFuture(dateString: string): boolean {
  const dateOnly = dateString.split('T')[0]
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = getLocalDateString(nextWeek)
  return dateOnly > nextWeekStr
}

/**
 * Filter tasks by date option
 * Note: Expects tasks to already have exclusions applied (archived/excluded labels)
 */
export function filterTasksByDateOption(tasks: TodoistTask[], optionId: string): TodoistTask[] {
  switch (optionId) {
    case 'overdue':
      return tasks.filter(task => {
        if (!task.due) return false
        const dateStr = task.due.date
        return isOverdue(dateStr)
      })
    
    case 'today':
      return tasks.filter(task => {
        if (!task.due) return false
        const dateStr = task.due.date
        return isToday(dateStr)
      })
    
    case 'tomorrow':
      return tasks.filter(task => {
        if (!task.due) return false
        const dateStr = task.due.date
        return isTomorrow(dateStr)
      })
    
    case 'next_7_days':
      return tasks.filter(task => {
        if (!task.due) return false
        const dateStr = task.due.date
        return isNext7Days(dateStr)
      })
    
    case 'future':
      return tasks.filter(task => {
        if (!task.due) return false
        const dateStr = task.due.date
        return isFuture(dateStr)
      })
    
    case 'recurring':
      return tasks.filter(task => task.due?.recurring === true)
    
    default:
      return []
  }
}

/**
 * Hook to convert date ranges to dropdown options
 */
export function useDateOptions(
  tasks: TodoistTask[],
  config?: ModeConfig
): DropdownOption[] {
  const { calculateCount, filterEmpty } = useDropdownOptions({ tasks })

  return useMemo(() => {
    // Calculate counts for each date range
    const optionsWithCounts = DATE_OPTIONS.map(dateOption => {
      // Use the same filtering function for consistency
      const matchingTasks = filterTasksByDateOption(tasks, dateOption.id)
      const count = matchingTasks.length

      return {
        ...dateOption,
        count
      }
    })

    // Filter empty if configured
    return filterEmpty(optionsWithCounts, config?.hideEmpty || false)
  }, [tasks, config, calculateCount, filterEmpty])
}