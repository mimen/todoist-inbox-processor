import { DropdownOption, DropdownOptionType } from './dropdown'
import { ProcessingModeType } from './processing-mode'

/**
 * State management for queue progression
 */
export interface QueueState {
  /** All available queues for current mode */
  availableQueues: DropdownOption[]
  
  /** Current position in queue sequence */
  currentQueueIndex: number
  
  /** IDs of completed queues (for future state persistence) */
  completedQueues: string[]
  
  /** Optional queue configuration */
  queueConfig?: QueueConfiguration
}

/**
 * Configuration for queue behavior loaded from JSON
 */
export interface QueueConfiguration {
  /** Configuration for standard processing modes */
  standardModes: {
    [key in ProcessingModeType]?: ModeConfig
  }
  
  /** Custom queue sequences */
  customQueues?: CustomQueue[]
  
  /** Prioritized queue configuration */
  prioritizedQueue?: {
    enabled: boolean
    sequence: PrioritizedQueueItem[]
  }
  
  /** General queue behavior settings */
  behavior?: QueueBehavior
}

/**
 * Configuration for a specific processing mode
 */
export interface ModeConfig {
  /** How to sort options (default, name, priority, count) */
  sortBy?: string
  
  /** Sort direction (asc or desc) */
  sortDirection?: 'asc' | 'desc'
  
  /** Enable multi-select mode */
  multiSelect?: boolean
  
  /** Hide queues with no tasks */
  hideEmpty?: boolean
  
  /** IDs of items to exclude */
  excludeItems?: string[]
  
  /** Reverse the default order */
  reverseOrder?: boolean
}

/**
 * Defines a custom queue sequence
 */
export interface CustomQueue {
  /** Unique identifier */
  id: string
  
  /** Display name */
  name: string
  
  /** Icon (emoji or component) */
  icon?: string
  
  /** Description of the queue */
  description?: string
  
  /** Sequence of queue items */
  sequence: QueueItem[]
}

/**
 * Single item in a custom queue sequence
 */
export interface QueueItem {
  /** Type of queue item */
  type: DropdownOptionType
  
  /** ID of the specific item (project ID, priority level, etc.) */
  id: string
  
  /** Optional override label */
  label?: string
}

/**
 * Item in a prioritized queue sequence
 */
export interface PrioritizedQueueItem {
  /** Type of queue item (project, priority, preset, priority-projects) */
  type: 'project' | 'priority' | 'preset' | 'priority-projects'
  
  /** Value for the item (project ID, priority level, preset ID, or priority level for projects) */
  value: string
  
  /** Display name override */
  name?: string
  
  /** Icon override */
  icon?: string
}

/**
 * General queue behavior settings
 */
export interface QueueBehavior {
  /** Remember position when returning to the app */
  rememberPosition?: boolean
  
  /** Automatically advance to next queue when current is empty */
  autoAdvance?: boolean
  
  /** Show queues even if they have no tasks */
  showEmptyQueues?: boolean
  
  /** Ask for confirmation before switching queues */
  confirmQueueSwitch?: boolean
}

/**
 * Props for queue progression hook
 */
export interface UseQueueProgressionProps {
  mode: ProcessingModeType | `custom:${string}`
  dropdownOptions: DropdownOption[]
  config?: QueueConfiguration
}

/**
 * Return value from queue progression hook
 */
export interface QueueProgressionState {
  currentQueue: DropdownOption | null
  nextQueue: DropdownOption | null
  hasNextQueue: boolean
  moveToNextQueue: () => void
  queueProgress: {
    current: number
    total: number
  }
}