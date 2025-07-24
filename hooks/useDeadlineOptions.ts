import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistTask } from '@/lib/types'
import { ModeConfig } from '@/types/queue'
import { DEADLINE_OPTIONS } from '@/constants/deadline-options'
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
 * Check if a deadline is overdue
 */
function isOverdue(dateString: string): boolean {
  const dateOnly = dateString.split('T')[0]
  const today = new Date()
  const todayStr = getLocalDateString(today)
  return dateOnly < todayStr
}

/**
 * Check if a deadline is today
 */
function isToday(dateString: string): boolean {
  const dateOnly = dateString.split('T')[0]
  const today = new Date()
  const todayStr = getLocalDateString(today)
  return dateOnly === todayStr
}

/**
 * Check if a deadline is tomorrow
 */
function isTomorrow(dateString: string): boolean {
  const dateOnly = dateString.split('T')[0]
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = getLocalDateString(tomorrow)
  return dateOnly === tomorrowStr
}

/**
 * Check if a deadline is this week (excluding today and tomorrow)
 */
function isThisWeek(dateString: string): boolean {
  const dateOnly = dateString.split('T')[0]
  const today = new Date()
  
  // Get day after tomorrow
  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(today.getDate() + 2)
  const dayAfterTomorrowStr = getLocalDateString(dayAfterTomorrow)
  
  // Get end of current week (Sunday)
  const endOfWeek = new Date(today)
  const daysUntilSunday = 7 - today.getDay()
  endOfWeek.setDate(today.getDate() + daysUntilSunday)
  const endOfWeekStr = getLocalDateString(endOfWeek)
  
  return dateOnly >= dayAfterTomorrowStr && dateOnly <= endOfWeekStr
}

/**
 * Check if a deadline is this month (excluding this week)
 */
function isThisMonth(dateString: string): boolean {
  const dateOnly = dateString.split('T')[0]
  const today = new Date()
  
  // Get start of next week
  const startOfNextWeek = new Date(today)
  const daysUntilSunday = 7 - today.getDay()
  startOfNextWeek.setDate(today.getDate() + daysUntilSunday + 1)
  const startOfNextWeekStr = getLocalDateString(startOfNextWeek)
  
  // Get end of current month
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const endOfMonthStr = getLocalDateString(endOfMonth)
  
  return dateOnly >= startOfNextWeekStr && dateOnly <= endOfMonthStr
}

/**
 * Filter tasks by deadline option
 * Note: Expects tasks to already have exclusions applied (archived/excluded labels)
 */
export function filterTasksByDeadlineOption(tasks: TodoistTask[], optionId: string): TodoistTask[] {
  switch (optionId) {
    case 'overdue':
      return tasks.filter(task => {
        if (!task.deadline) return false
        const dateStr = task.deadline.date
        return isOverdue(dateStr)
      })
    
    case 'today':
      return tasks.filter(task => {
        if (!task.deadline) return false
        const dateStr = task.deadline.date
        return isToday(dateStr)
      })
    
    case 'tomorrow':
      return tasks.filter(task => {
        if (!task.deadline) return false
        const dateStr = task.deadline.date
        return isTomorrow(dateStr)
      })
    
    case 'this_week':
      return tasks.filter(task => {
        if (!task.deadline) return false
        const dateStr = task.deadline.date
        return isThisWeek(dateStr)
      })
    
    case 'this_month':
      return tasks.filter(task => {
        if (!task.deadline) return false
        const dateStr = task.deadline.date
        return isThisMonth(dateStr)
      })
    
    default:
      return []
  }
}

/**
 * Hook to convert deadline ranges to dropdown options
 */
export function useDeadlineOptions(
  tasks: TodoistTask[],
  config?: ModeConfig
): DropdownOption[] {
  const { calculateCount, filterEmpty } = useDropdownOptions({ tasks })

  return useMemo(() => {
    // Calculate counts for each deadline range
    const optionsWithCounts = DEADLINE_OPTIONS.map(deadlineOption => {
      // Use the same filtering function for consistency
      const matchingTasks = filterTasksByDeadlineOption(tasks, deadlineOption.id)
      const count = matchingTasks.length

      return {
        ...deadlineOption,
        count
      }
    })

    // Filter empty if configured
    return filterEmpty(optionsWithCounts, config?.hideEmpty || false)
  }, [tasks, config, calculateCount, filterEmpty])
}