import { DropdownConfig } from '@/types/dropdown'
import { ProcessingModeType } from '@/types/processing-mode'
import { QueueConfiguration } from '@/types/queue'

/**
 * Generates UnifiedDropdown configuration based on dropdown type and queue config
 */
export function getDropdownConfig(
  type: ProcessingModeType,
  queueConfig: QueueConfiguration,
  overrides?: Partial<DropdownConfig>
): DropdownConfig {
  const modeConfig = queueConfig.standardModes[type]
  
  const baseConfig: DropdownConfig = {
    selectionMode: modeConfig?.multiSelect ? 'multi' : 'single',
    showSearch: getSearchDefault(type),
    showCounts: true,
    showPriority: type === 'project',
    hierarchical: type === 'project',
    placeholder: getPlaceholder(type)
  }
  
  return { ...baseConfig, ...overrides }
}

/**
 * Get default search setting for each dropdown type
 */
function getSearchDefault(type: ProcessingModeType): boolean {
  switch (type) {
    case 'project':
    case 'label':
      return true
    default:
      return false
  }
}

/**
 * Get default placeholder for each dropdown type
 */
function getPlaceholder(type: ProcessingModeType): string {
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
    default:
      return 'Select option...'
  }
}