'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { TodoistUser } from '@/lib/types'

interface AssigneeSelectionOverlayProps {
  isVisible: boolean
  onClose: () => void
  onAssigneeSelect: (userId: string | null) => void
  currentAssigneeId?: string
  collaborators: TodoistUser[]
}

export default function AssigneeSelectionOverlay({
  isVisible,
  onClose,
  onAssigneeSelect,
  currentAssigneeId,
  collaborators
}: AssigneeSelectionOverlayProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedIndexRef = useRef(selectedIndex)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Update ref whenever selectedIndex changes
  useEffect(() => {
    selectedIndexRef.current = selectedIndex
  }, [selectedIndex])

  // Add "Unassign" option if task is currently assigned
  const options = useMemo(() => {
    return currentAssigneeId 
      ? [{ id: null, name: 'Unassign', email: '', avatarSmall: undefined, avatarMedium: undefined, avatarBig: undefined }, ...collaborators]
      : collaborators
  }, [currentAssigneeId, collaborators])

  useEffect(() => {
    if (isVisible) {
      // Reset selection to current assignee or first option
      const currentIndex = options.findIndex(opt => {
        if (opt.id === null) {
          return currentAssigneeId === null || currentAssigneeId === undefined
        }
        return String(opt.id) === String(currentAssigneeId)
      })
      const initialIndex = currentIndex >= 0 ? currentIndex : 0
      console.log('Setting initial selectedIndex:', initialIndex, 'for currentAssigneeId:', currentAssigneeId)
      setSelectedIndex(initialIndex)
      
      // Focus the overlay to ensure keyboard events work
      setTimeout(() => {
        overlayRef.current?.focus()
      }, 50)
    }
  }, [isVisible, currentAssigneeId, options])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('AssigneeOverlay: keydown event', e.key, 'currentAssigneeId:', currentAssigneeId)
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        e.stopPropagation()
        console.log('ArrowDown pressed, current selectedIndex:', selectedIndex)
        setSelectedIndex(prev => {
          const newIndex = prev < options.length - 1 ? prev + 1 : prev
          console.log('Setting new index:', newIndex, 'from:', prev)
          // Scroll to selected item
          setTimeout(() => {
            const element = document.querySelector(`[data-option-index="${newIndex}"]`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }, 0)
          return newIndex
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        e.stopPropagation()
        console.log('ArrowUp pressed, current selectedIndex:', selectedIndex)
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : prev
          console.log('Setting new index:', newIndex, 'from:', prev)
          // Scroll to selected item
          setTimeout(() => {
            const element = document.querySelector(`[data-option-index="${newIndex}"]`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }, 0)
          return newIndex
        })
        break
      case 'Enter':
        e.preventDefault()
        if (options[selectedIndex]) {
          onAssigneeSelect(options[selectedIndex].id)
        }
        break
      case 'Delete':
      case 'Backspace':
        if (e.shiftKey) {
          e.preventDefault()
          // Clear assignee (unassign)
          onAssigneeSelect(null)
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (index < options.length) {
          onAssigneeSelect(options[index].id)
        }
        break
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div 
        ref={overlayRef}
        className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Assign to</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {options.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>No collaborators available</p>
            <p className="text-sm mt-1">This might be a personal project</p>
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto flex-1 -mx-2 px-2">
            {options.map((option, index) => (
              <button
                key={option.id || 'unassign'}
                data-option-index={index}
                onClick={() => onAssigneeSelect(option.id)}
                className={`w-full text-left px-4 py-3 rounded-md flex items-center space-x-3 transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className={`text-sm font-medium mr-2 ${
                  index === selectedIndex ? 'text-white/70' : 'text-gray-400'
                }`}>
                  {index + 1}
                </span>
                
                {option.id !== null ? (
                  <>
                    {option.avatarSmall && (
                      <img 
                        src={option.avatarSmall} 
                        alt={option.name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          // Instead of hiding, show fallback icon
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement?.querySelector('.avatar-fallback')?.classList.remove('hidden')
                        }}
                      />
                    )}
                    <div className={`avatar-fallback w-8 h-8 rounded-full flex items-center justify-center ${
                      index === selectedIndex ? 'bg-blue-700' : 'bg-gray-200'
                    } ${option.avatarSmall ? 'hidden' : ''}`}>
                      <svg className={`w-5 h-5 ${
                        index === selectedIndex ? 'text-white' : 'text-gray-500'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        index === selectedIndex ? 'text-white' : 'text-gray-900'
                      }`}>
                        {option.name}
                      </p>
                      {option.email && (
                        <p className={`text-sm ${
                          index === selectedIndex ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {option.email}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === selectedIndex ? 'bg-blue-700' : 'bg-gray-200'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        index === selectedIndex ? 'text-white' : 'text-gray-500'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className={`font-medium ${
                      index === selectedIndex ? 'text-white' : 'text-gray-900'
                    }`}>
                      Unassign
                    </span>
                  </>
                )}
                
                {option.id === currentAssigneeId && (
                  <span className={`text-xs px-2 py-1 rounded ml-auto ${
                    index === selectedIndex 
                      ? 'bg-blue-700 text-blue-100' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    Current
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          Use ↑↓ to navigate, Enter to select, 1-9 for quick select
        </div>
      </div>
    </div>
  )
}