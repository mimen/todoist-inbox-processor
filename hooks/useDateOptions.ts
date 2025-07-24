import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistTask } from '@/lib/types'
import { ModeConfig } from '@/types/queue'
import { DATE_OPTIONS } from '@/constants/date-options'
import { useDropdownOptions } from './useDropdownOptions'

/**
 * Check if a date is overdue
 */
function isOverdue(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date < today
}

/**
 * Check if a date is today
 */
function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

/**
 * Check if a date is tomorrow
 */
function isTomorrow(dateString: string): boolean {
  const date = new Date(dateString)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.toDateString() === tomorrow.toDateString()
}

/**
 * Check if a date is within next 7 days (excluding today and tomorrow)
 */
function isNext7Days(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(today.getDate() + 2)
  const nextWeek = new Date()
  nextWeek.setDate(today.getDate() + 7)
  
  date.setHours(0, 0, 0, 0)
  dayAfterTomorrow.setHours(0, 0, 0, 0)
  nextWeek.setHours(23, 59, 59, 999)
  
  return date >= dayAfterTomorrow && date <= nextWeek
}

/**
 * Check if a date is future (beyond 7 days)
 */
function isFuture(dateString: string): boolean {
  const date = new Date(dateString)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(23, 59, 59, 999)
  return date > nextWeek
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
      let count = 0

      switch (dateOption.id) {
        case 'overdue':
          count = calculateCount(task => !!task.due && isOverdue(task.due.date))
          break
        case 'today':
          count = calculateCount(task => !!task.due && isToday(task.due.date))
          break
        case 'tomorrow':
          count = calculateCount(task => !!task.due && isTomorrow(task.due.date))
          break
        case 'next_7_days':
          count = calculateCount(task => !!task.due && isNext7Days(task.due.date))
          break
        case 'future':
          count = calculateCount(task => !!task.due && isFuture(task.due.date))
          break
        case 'recurring':
          count = calculateCount(task => task.due?.recurring === true)
          break
      }

      return {
        ...dateOption,
        count
      }
    })

    // Filter empty if configured
    return filterEmpty(optionsWithCounts, config?.hideEmpty || false)
  }, [tasks, config, calculateCount, filterEmpty])
}