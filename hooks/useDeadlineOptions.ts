import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistTask } from '@/lib/types'
import { ModeConfig } from '@/types/queue'
import { DEADLINE_OPTIONS } from '@/constants/deadline-options'
import { useDropdownOptions } from './useDropdownOptions'

/**
 * Check if a deadline is overdue
 */
function isOverdue(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date < today
}

/**
 * Check if a deadline is today
 */
function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

/**
 * Check if a deadline is tomorrow
 */
function isTomorrow(dateString: string): boolean {
  const date = new Date(dateString)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.toDateString() === tomorrow.toDateString()
}

/**
 * Check if a deadline is this week (excluding today and tomorrow)
 */
function isThisWeek(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(today.getDate() + 2)
  
  // Get end of current week (Sunday)
  const endOfWeek = new Date(today)
  const daysUntilSunday = 7 - today.getDay()
  endOfWeek.setDate(today.getDate() + daysUntilSunday)
  endOfWeek.setHours(23, 59, 59, 999)
  
  date.setHours(0, 0, 0, 0)
  dayAfterTomorrow.setHours(0, 0, 0, 0)
  
  return date >= dayAfterTomorrow && date <= endOfWeek
}

/**
 * Check if a deadline is this month (excluding this week)
 */
function isThisMonth(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  
  // Get start of next week
  const startOfNextWeek = new Date(today)
  const daysUntilSunday = 7 - today.getDay()
  startOfNextWeek.setDate(today.getDate() + daysUntilSunday + 1)
  startOfNextWeek.setHours(0, 0, 0, 0)
  
  // Get end of current month
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  endOfMonth.setHours(23, 59, 59, 999)
  
  return date >= startOfNextWeek && date <= endOfMonth
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
      let count = 0

      switch (deadlineOption.id) {
        case 'overdue':
          count = calculateCount(task => !!task.deadline && isOverdue(task.deadline.date))
          break
        case 'today':
          count = calculateCount(task => !!task.deadline && isToday(task.deadline.date))
          break
        case 'tomorrow':
          count = calculateCount(task => !!task.deadline && isTomorrow(task.deadline.date))
          break
        case 'this_week':
          count = calculateCount(task => !!task.deadline && isThisWeek(task.deadline.date))
          break
        case 'this_month':
          count = calculateCount(task => !!task.deadline && isThisMonth(task.deadline.date))
          break
      }

      return {
        ...deadlineOption,
        count
      }
    })

    // Filter empty if configured
    return filterEmpty(optionsWithCounts, config?.hideEmpty || false)
  }, [tasks, config, calculateCount, filterEmpty])
}