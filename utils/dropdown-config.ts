import { DropdownConfig } from '@/types/dropdown'
import { ProcessingModeType } from '@/types/processing-mode'
import { QueueConfiguration } from '@/types/queue'

/**
 * Generates UnifiedDropdown configuration based on dropdown type and queue config
 */
export function getDropdownConfig(
  type: ProcessingModeType | 'prioritized',
  queueConfig: QueueConfiguration,
  overrides?: Partial<DropdownConfig>
): DropdownConfig {
  const modeConfig = type === 'prioritized' ? undefined : queueConfig.standardModes[type]
  
  const baseConfig: DropdownConfig = {
    selectionMode: modeConfig?.multiSelect ? 'multi' : 'single',
    showSearch: getSearchDefault(type),
    showCounts: true,
    showPriority: type === 'project' || type === 'prioritized',
    hierarchical: type === 'project',
    placeholder: getPlaceholder(type),
    showSort: getSortDefault(type)
  }
  
  return { ...baseConfig, ...overrides }
}

/**
 * Get default search setting for each dropdown type
 */
function getSearchDefault(type: ProcessingModeType | 'prioritized'): boolean {
  switch (type) {
    case 'project':
    case 'label':
    case 'prioritized':
      return true
    default:
      return false
  }
}

/**
 * Get default sort setting for each dropdown type
 */
function getSortDefault(type: ProcessingModeType | 'prioritized'): boolean {
  switch (type) {
    case 'project':
    case 'label':
    case 'all':
      return true
    default:
      return false
  }
}

/**
 * Get default placeholder for each dropdown type
 */
function getPlaceholder(type: ProcessingModeType | 'prioritized'): string {
  switch (type) {
    case 'project':
      return 'Select project...'
    case 'priority':
      return 'Select priority...'
    case 'label':
      return 'Select labels...'
    case 'date':
      return 'Select date...'
    case 'deadline':
      return 'Select deadline...'
    case 'preset':
      return 'Select preset...'
    case 'all':
      return 'Select all...'
    case 'prioritized':
      return 'Select queue...'
    default:
      return 'Select option...'
  }
}