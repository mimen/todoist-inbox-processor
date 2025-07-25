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
}

const SortDropdown = forwardRef<SortDropdownRef, SortDropdownProps>(
  ({ options, value, onChange, onOpen, className = '' }, ref) => {
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
          const newState = !isOpen
          setIsOpen(newState)
          if (newState && onOpen) {
            onOpen()
          }
        }}
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        title="Change sort order"
      >
        <ArrowUpDown className="w-3 h-3" />
        <span className="hidden sm:inline">{value.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {options.map((option, index) => (
              <button
                key={`${option.value}-${option.direction}-${index}`}
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 transition-colors ${
                  option.value === value.value && option.direction === value.direction
                    ? 'bg-gray-50 font-medium'
                    : ''
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