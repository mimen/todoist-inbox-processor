import { ReactNode } from 'react'

/**
 * Represents a single option in a dropdown
 */
export interface DropdownOption {
  /** Unique identifier for the option */
  id: string
  
  /** Display text for the option */
  label: string
  
  /** Icon component or emoji string */
  icon?: ReactNode | string
  
  /** Color for the icon (hex or Todoist color name) */
  iconColor?: string
  
  /** Number of tasks for this option */
  count?: number
  
  /** Optional description text */
  description?: string
  
  /** Additional data (project object, priority value, etc.) */
  metadata?: any
  
  /** For hierarchical items (sub-projects) */
  children?: DropdownOption[]
  
  /** Type for icon rendering */
  type: DropdownOptionType
}

/**
 * Types of dropdown options for icon rendering
 */
export type DropdownOptionType = 
  | 'project' 
  | 'priority' 
  | 'label' 
  | 'date' 
  | 'deadline' 
  | 'preset' 
  | 'filter' 
  | 'all'
  | 'custom'

/**
 * Configuration for dropdown behavior and appearance
 */
export interface DropdownConfig {
  /** Single or multi-select mode */
  selectionMode: 'single' | 'multi'
  
  /** Show search input */
  showSearch?: boolean
  
  /** Show task counts */
  showCounts?: boolean
  
  /** Show priority badges (P1-P4) */
  showPriority?: boolean
  
  /** Enable hierarchical display (only works with default sort) */
  hierarchical?: boolean
  
  /** Available sort options */
  sortOptions?: SortOption[]
  
  /** Default sort key */
  defaultSort?: string
  
  /** Placeholder text when no selection */
  placeholder?: string
  
  /** Message when no options available */
  emptyMessage?: string
}

/**
 * Defines a sort option for dropdowns
 */
export interface SortOption {
  /** Unique key for this sort option */
  key: string
  
  /** Display label for the sort option */
  label: string
  
  /** Function to compare two options */
  sortFn: (a: DropdownOption, b: DropdownOption) => number
}

/**
 * Ref handle for UnifiedDropdown component
 */
export interface UnifiedDropdownRef {
  openDropdown: () => void
  closeDropdown: () => void
  focusInput?: () => void
}