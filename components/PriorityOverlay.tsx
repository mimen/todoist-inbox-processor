'use client'

import { useEffect } from 'react'

interface PriorityOverlayProps {
  currentPriority: 1 | 2 | 3 | 4
  onPrioritySelect: (priority: 1 | 2 | 3 | 4) => void
  onClose: () => void
  isVisible: boolean
}

export default function PriorityOverlay({ currentPriority, onPrioritySelect, onClose, isVisible }: PriorityOverlayProps) {
  // Convert API priority (1-4) to UI priority (P4-P1)
  const getUIPriority = (apiPriority: number) => {
    return 5 - apiPriority // 4→P1, 3→P2, 2→P3, 1→P4
  }

  const getPriorityColor = (apiPriority: number) => {
    const uiPriority = getUIPriority(apiPriority)
    switch (uiPriority) {
      case 1: return 'bg-red-500 border-red-500 text-white'    // P1 = Urgent
      case 2: return 'bg-orange-500 border-orange-500 text-white' // P2 = High
      case 3: return 'bg-blue-500 border-blue-500 text-white'  // P3 = Medium
      default: return 'bg-gray-500 border-gray-500 text-white' // P4 = Normal
    }
  }

  const getPriorityLabel = (apiPriority: number) => {
    const uiPriority = getUIPriority(apiPriority)
    switch (uiPriority) {
      case 1: return 'Urgent'  // P1
      case 2: return 'High'    // P2
      case 3: return 'Medium'  // P3
      default: return 'Normal' // P4
    }
  }

  // Handle keyboard input for priority selection
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      switch (e.key) {
        case '1':
          onPrioritySelect(4) // P1 = API priority 4
          break
        case '2':
          onPrioritySelect(3) // P2 = API priority 3
          break
        case '3':
          onPrioritySelect(2) // P3 = API priority 2
          break
        case '4':
          onPrioritySelect(1) // P4 = API priority 1
          break
        case 'Delete':
        case 'Backspace':
          if (e.shiftKey) {
            onPrioritySelect(1) // Clear to P4 (lowest priority)
          }
          break
        case 'Escape':
        case '`':
        case 'p':
        case 'P':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, onPrioritySelect, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Priority</h2>
          <p className="text-gray-600 mb-8">Press 1, 2, 3, or 4 to select priority</p>
          
          <div className="grid grid-cols-2 gap-4">
            {[4, 3, 2, 1].map((apiPriority) => {
              const uiPriority = getUIPriority(apiPriority)
              const isSelected = currentPriority === apiPriority
              
              return (
                <button
                  key={apiPriority}
                  onClick={() => onPrioritySelect(apiPriority as 1 | 2 | 3 | 4)}
                  className={`
                    p-6 rounded-xl border-2 font-bold text-lg transition-all duration-200 transform
                    ${isSelected 
                      ? `${getPriorityColor(apiPriority)} scale-105 shadow-lg` 
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:scale-102'
                    }
                  `}
                >
                  <div className="text-3xl font-black mb-2">P{uiPriority}</div>
                  <div className="text-sm opacity-90">{getPriorityLabel(apiPriority)}</div>
                  <div className="text-xs mt-2 opacity-75">Press {uiPriority}</div>
                </button>
              )
            })}
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            Release <kbd className="px-2 py-1 bg-gray-100 rounded">P</kbd> key to close
          </div>
        </div>
      </div>
    </div>
  )
}