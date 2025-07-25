'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { 
  DropdownOption, 
  DropdownConfig, 
  UnifiedDropdownRef 
} from '@/types/dropdown'
import { ProcessingModeType } from '@/types/processing-mode'
import OptionIcon from './OptionIcon'
import { SortDropdown } from './SortDropdown'
import { DROPDOWN_SORT_OPTIONS, getDefaultSortOption, type SortOption } from '@/constants/dropdown-sort-options'
import { sortDropdownOptions } from '@/utils/dropdown-sorting'
import { useQueueConfig } from '@/hooks/useQueueConfig'
import { useProjectOptions } from '@/hooks/useProjectOptions'
import { usePriorityOptions } from '@/hooks/usePriorityOptions'
import { useLabelOptions } from '@/hooks/useLabelOptions'
import { useDateOptions } from '@/hooks/useDateOptions'
import { useDeadlineOptions } from '@/hooks/useDeadlineOptions'
import { usePresetOptions } from '@/hooks/usePresetOptions'
import { useAllOptions } from '@/hooks/useAllOptions'

interface UnifiedDropdownProps {
  options: DropdownOption[]
  config: DropdownConfig
  value: string | string[]
  onChange: (value: string | string[], displayName: string) => void
  type?: ProcessingModeType | 'filter' | 'assignee'
  onOpen?: () => void
  onClose?: () => void
  className?: string
  disabled?: boolean
  loading?: boolean
  error?: string | null
  showSort?: boolean
  // TODO: Future enhancements:
  // sortable?: boolean // Enable drag-and-drop reordering
  // groupBy?: string // Group options by a metadata field
  // customFilter?: (option: DropdownOption, query: string) => boolean
  // renderOption?: (option: DropdownOption) => React.ReactNode
  // maxHeight?: number // Custom max height for dropdown
  // virtualScroll?: boolean // Enable virtual scrolling for large lists
}

/**
 * Unified dropdown component that handles all dropdown variations
 */
const UnifiedDropdown = forwardRef<UnifiedDropdownRef, UnifiedDropdownProps>(({
  options,
  config,
  value,
  onChange,
  type,
  onOpen,
  onClose,
  className = '',
  disabled = false,
  loading = false,
  error = null,
  showSort = true
}, ref) => {
  // State
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [keyboardSelectedIndex, setKeyboardSelectedIndex] = useState(0)
  
  // Sort state
  const sortOptions = type ? DROPDOWN_SORT_OPTIONS[type] : []
  const defaultSort = type ? getDefaultSortOption(type) : null
  const [currentSort, setCurrentSort] = useState(defaultSort)
  
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const optionsListRef = useRef<HTMLDivElement>(null)

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    openDropdown: () => {
      if (!disabled) {
        setIsOpen(true)
        setKeyboardSelectedIndex(0)
      }
    },
    closeDropdown: () => {
      setIsOpen(false)
      setSearchTerm('')
    },
    focusInput: () => {
      searchInputRef.current?.focus()
    }
  }))

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        onClose?.()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      if (config.showSearch && searchInputRef.current) {
        searchInputRef.current.focus()
      }
      onOpen?.()
    }
  }, [isOpen, config.showSearch, onOpen])

  // Filter and sort options
  const filteredOptions = useMemo(() => {
    // First filter by search
    let filtered = options
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = options.filter(option => 
        option.label.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
      )
    }
    
    // Then apply sorting if we have a sort configuration
    if (currentSort && type) {
      const sortConfig = { 
        sortBy: currentSort.value, 
        sortDirection: currentSort.direction 
      }
      return sortDropdownOptions(filtered, sortConfig, currentSort.value)
    }
    
    return filtered
  }, [options, searchTerm, currentSort, type])

  // Determine if we should show hierarchy
  const showHierarchy = type === 'project' && currentSort?.value === 'hierarchy'
  
  // Flatten options for keyboard navigation (including children)
  const flatOptions = useMemo(() => {
    const flat: DropdownOption[] = []
    
    const addOption = (option: DropdownOption) => {
      // For hierarchical display, preserve existing indent from metadata
      const existingIndent = option.metadata?.indent || 0
      const optionWithIndent = {
        ...option,
        metadata: { 
          ...option.metadata, 
          indent: showHierarchy ? existingIndent : 0 
        }
      }
      flat.push(optionWithIndent)
      
      // Only include children if hierarchical mode is enabled
      if (option.children && showHierarchy) {
        option.children.forEach(child => addOption(child))
      }
    }

    filteredOptions.forEach(option => addOption(option))
    return flat
  }, [filteredOptions, showHierarchy])

  // Get display value
  const getDisplayValue = () => {
    if (config.selectionMode === 'multi') {
      const selectedValues = value as string[]
      if (selectedValues.length === 0) {
        return config.placeholder || 'Select...'
      }
      const selectedOptions = options.filter(opt => selectedValues.includes(opt.id))
      return selectedOptions.map(opt => opt.label).join(', ')
    } else {
      const selectedOption = options.find(opt => opt.id === value)
      return selectedOption?.label || config.placeholder || 'Select...'
    }
  }

  // Get total count
  const getTotalCount = () => {
    if (config.selectionMode === 'multi') {
      const selectedValues = value as string[]
      const selectedOptions = options.filter(opt => selectedValues.includes(opt.id))
      return selectedOptions.reduce((sum, opt) => sum + (opt.count || 0), 0)
    } else {
      const selectedOption = options.find(opt => opt.id === value)
      return selectedOption?.count || 0
    }
  }

  // Handle option selection
  const handleSelect = (option: DropdownOption) => {
    if (config.selectionMode === 'multi') {
      const currentValues = value as string[]
      const newValues = currentValues.includes(option.id)
        ? currentValues.filter(v => v !== option.id)
        : [...currentValues, option.id]
      
      const selectedOptions = options.filter(opt => newValues.includes(opt.id))
      const displayName = selectedOptions.map(opt => opt.label).join(', ')
      onChange(newValues, displayName)
    } else {
      onChange(option.id, option.label)
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setKeyboardSelectedIndex(prev => 
            Math.min(prev + 1, flatOptions.length - 1)
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setKeyboardSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (flatOptions[keyboardSelectedIndex]) {
            handleSelect(flatOptions[keyboardSelectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setSearchTerm('')
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, keyboardSelectedIndex, flatOptions, handleSelect])

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && optionsListRef.current) {
      const selectedElement = optionsListRef.current.querySelector(
        `[data-index="${keyboardSelectedIndex}"]`
      )
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [keyboardSelectedIndex, isOpen])

  const hasValue = config.selectionMode === 'multi' 
    ? (value as string[]).length > 0 
    : !!value

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center gap-2">
        {/* Dropdown Button */}
        <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={config.placeholder || 'Select option'}
        className={`
          w-full flex items-center justify-between p-3
          bg-gray-50 hover:bg-gray-100 border border-gray-200 
          rounded-md transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center space-x-3">
          {/* Show icon for selected option */}
          {hasValue && (() => {
            const selectedOption = config.selectionMode === 'multi' 
              ? options.find(opt => (value as string[]).includes(opt.id))
              : options.find(opt => opt.id === value)
            return selectedOption ? <OptionIcon option={selectedOption} size="md" /> : null
          })()}
          <span className={hasValue ? 'text-gray-900' : 'text-gray-500'}>
            {getDisplayValue()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {config.showCounts && hasValue && (
            <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
              {getTotalCount()}
            </span>
          )}
          <ChevronDown 
            className={`
              w-4 h-4 text-gray-400 transition-transform duration-200
              ${isOpen ? 'rotate-180' : ''}
            `}
          />
        </div>
        </button>
        
        {/* Sort Dropdown */}
        {showSort && type && sortOptions && sortOptions.length > 0 && currentSort && (
          <SortDropdown
            options={sortOptions}
            value={currentSort}
            onChange={setCurrentSort}
          />
        )}
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="
            absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg 
            border border-gray-200 overflow-hidden
          "
        >
          {/* Search Input */}
          {config.showSearch && (
            <div className="p-2 border-b border-gray-200">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setKeyboardSelectedIndex(0)
                }}
                placeholder="Search..."
                className="
                  w-full px-3 py-2 text-sm text-gray-900 bg-white
                  border border-gray-200 rounded-md 
                  focus:outline-none focus:ring-2 
                  focus:ring-blue-500 focus:border-transparent
                  placeholder-gray-400
                "
              />
            </div>
          )}

          {/* Options List */}
          <div 
            ref={optionsListRef}
            role="listbox"
            aria-label={config.placeholder || 'Options'}
            className="max-h-64 overflow-y-auto"
          >
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <div className="text-sm text-gray-500 mt-2">Loading...</div>
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-red-600 text-center">
                {error}
              </div>
            ) : flatOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {searchTerm ? 'No results found' : (config.emptyMessage || 'No options available')}
              </div>
            ) : (
              flatOptions.map((option, index) => (
                <OptionItem
                  key={option.id}
                  option={option}
                  index={index}
                  isSelected={
                    config.selectionMode === 'multi'
                      ? (value as string[]).includes(option.id)
                      : value === option.id
                  }
                  isKeyboardSelected={index === keyboardSelectedIndex}
                  onSelect={() => handleSelect(option)}
                  config={config}
                />
              ))
            )}
          </div>

          {/* Multi-select Clear All */}
          {config.selectionMode === 'multi' && (value as string[]).length > 0 && (
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={() => onChange([], '')}
                className="
                  w-full px-3 py-2 text-sm text-gray-600 
                  hover:bg-gray-50 rounded-md transition-colors
                "
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

/**
 * Individual option item component
 */
interface OptionItemProps {
  option: DropdownOption
  index: number
  isSelected: boolean
  isKeyboardSelected: boolean
  onSelect: () => void
  config: DropdownConfig
}

const OptionItem: React.FC<OptionItemProps> = ({
  option,
  index,
  isSelected,
  isKeyboardSelected,
  onSelect,
  config
}) => {
  const indent = option.metadata?.indent || 0
  
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      data-index={index}
      onClick={onSelect}
      className={`
        w-full flex items-center justify-between px-4 py-2.5
        text-sm text-left transition-colors
        ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-700'}
        ${isKeyboardSelected ? 'bg-gray-100' : ''}
        ${!isSelected && !isKeyboardSelected ? 'hover:bg-gray-50' : ''}
      `}
      style={{ paddingLeft: `${16 + indent * 20}px` }}
    >
      <div className="flex items-center space-x-3">
        {/* Multi-select checkbox */}
        {config.selectionMode === 'multi' && (
          <div className={`
            w-4 h-4 rounded border-2 flex items-center justify-center
            ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
          `}>
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}

        {/* Option icon */}
        <OptionIcon option={option} size="md" />

        {/* Label and description */}
        <div className="flex-1">
          <div className="font-medium">{option.label}</div>
          {option.description && (
            <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
          )}
        </div>
      </div>

      {/* Count badge */}
      {config.showCounts && option.count !== undefined && (
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-2">
          {option.count}
        </span>
      )}
    </button>
  )
}

UnifiedDropdown.displayName = 'UnifiedDropdown'

export default UnifiedDropdown