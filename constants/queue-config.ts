import { QueueConfiguration } from '@/types/queue'

/**
 * Default queue configuration
 * This will eventually be loaded from queue-config.json
 */
export const DEFAULT_QUEUE_CONFIG: QueueConfiguration = {
  standardModes: {
    project: {
      sortBy: 'default',
      multiSelect: false,
      hideEmpty: false
    },
    priority: {
      reverseOrder: false,
      hideEmpty: false,
      multiSelect: false
    },
    label: {
      sortBy: 'count',
      excludeItems: [],
      multiSelect: true
    },
    date: {
      hideEmpty: false
    },
    deadline: {
      hideEmpty: false
    },
    preset: {
      hideEmpty: false
    },
    all: {
      sortBy: 'default'
    }
  },
  customQueues: [],
  behavior: {
    rememberPosition: false,
    autoAdvance: false,
    showEmptyQueues: true,
    confirmQueueSwitch: false
  }
}

/**
 * Sort option definitions that can be used across different dropdowns
 */
export const COMMON_SORT_OPTIONS = {
  alphabetical: {
    key: 'name',
    label: 'Sort by Name',
    sortFn: (a: any, b: any) => a.label.localeCompare(b.label)
  },
  count: {
    key: 'count',
    label: 'Sort by Task Count',
    sortFn: (a: any, b: any) => (b.count || 0) - (a.count || 0)
  },
  priority: {
    key: 'priority',
    label: 'Sort by Priority',
    sortFn: (a: any, b: any) => (b.metadata?.priority || 0) - (a.metadata?.priority || 0)
  }
}