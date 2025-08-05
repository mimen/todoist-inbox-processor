import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { ChevronDown, ArrowUpDown } from 'lucide-react'
import { SortOption } from '@/constants/dropdown-sort-options'

export interface SortDropdownRef {
  close: () => void
}

interface SortDropdownProps {
  options: SortOption[]
  value: SortOption
  onChange: (option: SortOption) => void
  onOpen?: () => void
  className?: string
  disabled?: boolean
}

const SortDropdown = forwardRef<SortDropdownRef, SortDropdownProps>(
  ({ options, value, onChange, onOpen, className = '', disabled = false }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    
    useImperativeHandle(ref, () => ({
      close: () => setIsOpen(false)
    }))

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option: SortOption) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => {
          if (!disabled) {
            const newState = !isOpen
            setIsOpen(newState)
            if (newState && onOpen) {
              onOpen()
            }
          }
        }}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'}`}
        title={disabled ? "No sort options available" : "Change sort order"}
      >
        <ArrowUpDown className="w-4 h-4" />
        <span>{value.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            {options.map((option, index) => (
              <button
                key={`${option.value}-${option.direction}-${index}`}
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  option.value === value.value && option.direction === value.direction
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

SortDropdown.displayName = 'SortDropdown'

export { SortDropdown, type SortDropdownRef }