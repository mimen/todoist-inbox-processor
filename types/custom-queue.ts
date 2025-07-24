import { TodoistTask } from '@/lib/types'
import { DropdownOption } from './dropdown'
import { ProcessingMode } from './processing-mode'

/**
 * Interface for custom queue implementations
 */
export interface CustomQueue {
  /** Unique identifier for the queue type */
  id: string
  
  /** Display name for the queue */
  name: string
  
  /** Description of what this queue filters */
  description: string
  
  /** Icon to display (Lucide icon name) */
  icon: string
  
  /** Generate dropdown options for this queue */
  getOptions: (tasks: TodoistTask[], config?: any) => DropdownOption[]
  
  /** Filter tasks based on selected value */
  filterTasks: (tasks: TodoistTask[], value: string | string[] | null) => TodoistTask[]
  
  /** Optional custom configuration */
  defaultConfig?: {
    sortBy?: string
    enableSearch?: boolean
    multiSelect?: boolean
    [key: string]: any
  }
  
  /** Optional validation for queue values */
  validateValue?: (value: any) => boolean
  
  /** Optional custom rendering component */
  customComponent?: React.ComponentType<{
    mode: ProcessingMode
    onChange: (value: any) => void
  }>
}

/**
 * Registry for custom queues
 */
export class CustomQueueRegistry {
  private static queues = new Map<string, CustomQueue>()
  
  /**
   * Register a custom queue
   */
  static register(queue: CustomQueue): void {
    if (this.queues.has(queue.id)) {
      console.warn(`Queue with id "${queue.id}" already registered. Overwriting.`)
    }
    this.queues.set(queue.id, queue)
  }
  
  /**
   * Get a custom queue by ID
   */
  static get(id: string): CustomQueue | undefined {
    return this.queues.get(id)
  }
  
  /**
   * Get all registered custom queues
   */
  static getAll(): CustomQueue[] {
    return Array.from(this.queues.values())
  }
  
  /**
   * Check if a queue is registered
   */
  static has(id: string): boolean {
    return this.queues.has(id)
  }
  
  /**
   * Unregister a queue
   */
  static unregister(id: string): boolean {
    return this.queues.delete(id)
  }
  
  /**
   * Clear all custom queues
   */
  static clear(): void {
    this.queues.clear()
  }
}

/**
 * Example custom queue implementation
 * TODO: Move to examples directory when implementing
 */
export const energyLevelQueue: CustomQueue = {
  id: 'energy',
  name: 'Energy Level',
  description: 'Filter tasks by required energy level',
  icon: 'Zap',
  
  getOptions: (tasks) => {
    const energyLevels = ['High', 'Medium', 'Low']
    const counts = new Map<string, number>()
    
    // Count tasks by energy level (stored in labels)
    tasks.forEach(task => {
      const energyLabel = task.labels.find(l => 
        energyLevels.some(level => l.toLowerCase() === `energy-${level.toLowerCase()}`)
      )
      if (energyLabel) {
        const level = energyLabel.split('-')[1]
        counts.set(level, (counts.get(level) || 0) + 1)
      }
    })
    
    return energyLevels.map(level => ({
      value: level.toLowerCase(),
      label: `${level} Energy`,
      count: counts.get(level.toLowerCase()) || 0,
      type: 'energy' as any,
      icon: level === 'High' ? 'Zap' : level === 'Medium' ? 'Battery' : 'BatteryLow'
    }))
  },
  
  filterTasks: (tasks, value) => {
    if (!value) return tasks
    return tasks.filter(task => 
      task.labels.some(label => 
        label.toLowerCase() === `energy-${value}`
      )
    )
  },
  
  defaultConfig: {
    sortBy: 'default',
    enableSearch: false
  }
}

/**
 * Hook for using custom queues
 * TODO: Implement in components when needed
 */
export function useCustomQueue(queueId: string) {
  const queue = CustomQueueRegistry.get(queueId)
  
  if (!queue) {
    throw new Error(`Custom queue "${queueId}" not found`)
  }
  
  return queue
}