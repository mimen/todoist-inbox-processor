'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TodoistTask, TodoistLabel } from '@/lib/types'
import { isExcludedLabel } from '@/lib/excluded-labels'

interface LabelSelectionOverlayProps {
  labels: TodoistLabel[]
  currentTask: TodoistTask
  onLabelsChange: (labels: string[]) => void
  onClose: () => void
  isVisible: boolean
}

export default function LabelSelectionOverlay({ 
  labels, 
  currentTask, 
  onLabelsChange, 
  onClose, 
  isVisible 
}: LabelSelectionOverlayProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLabels, setSelectedLabels] = useState<string[]>(currentTask.labels)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedLabelRef = useRef<HTMLButtonElement>(null)

  const getTodoistColor = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      'berry_red': '#b8256f',
      'red': '#db4035',
      'orange': '#ff9933',
      'yellow': '#fad000',
      'olive_green': '#afb83b',
      'lime_green': '#7ecc49',
      'green': '#299438',
      'mint_green': '#6accbc',
      'teal': '#158fad',
      'sky_blue': '#14aaf5',
      'light_blue': '#96c3eb',
      'blue': '#4073ff',
      'grape': '#884dff',
      'violet': '#af38eb',
      'lavender': '#eb96eb',
      'magenta': '#e05194',
      'salmon': '#ff8d85',
      'charcoal': '#808080',
      'grey': '#b8b8b8',
      'taupe': '#ccac93'
    }
    return colorMap[colorName] || '#299fe6'
  }

  // Filter labels based on search term, excluding system labels
  const filteredLabels = labels.filter(label => 
    !isExcludedLabel(label.name) &&
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Reset when opening
  useEffect(() => {
    if (isVisible) {
      setSearchTerm('')
      setSelectedLabels(currentTask.labels)
      setSelectedIndex(0)
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
    }
  }, [isVisible, currentTask.labels])

  // Update selected index when filtered labels change
  useEffect(() => {
    if (selectedIndex >= filteredLabels.length) {
      setSelectedIndex(Math.max(0, filteredLabels.length - 1))
    }
  }, [filteredLabels.length, selectedIndex])

  // Auto-scroll to keep selected label in view
  useEffect(() => {
    if (selectedLabelRef.current) {
      selectedLabelRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [selectedIndex])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, filteredLabels.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (filteredLabels[selectedIndex]) {
            toggleLabel(filteredLabels[selectedIndex].name)
          }
          break
        case 'Escape':
        case '`':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, selectedIndex, filteredLabels])

  const toggleLabel = useCallback((labelName: string) => {
    // Prevent assigning excluded labels
    if (isExcludedLabel(labelName)) {
      return;
    }
    
    const newLabels = selectedLabels.includes(labelName)
      ? selectedLabels.filter(l => l !== labelName)
      : [...selectedLabels, labelName]
    
    setSelectedLabels(newLabels)
    // Apply immediately
    onLabelsChange(newLabels)
  }, [selectedLabels, onLabelsChange])


  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Task Information Header */}
        <div className="p-6 border-b border-gray-200 bg-green-50 rounded-t-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">@</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-green-900">Select Labels</h2>
              <div className="text-sm text-green-700 mt-1">
                {selectedLabels.length} label{selectedLabels.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          </div>
          <h3 className="text-sm font-medium text-green-900 leading-tight">
            {currentTask.content}
          </h3>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-200">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            placeholder="Search labels..."
          />
          <div className="mt-2 text-sm text-gray-500">
            ↑↓ to navigate • Enter/Space to toggle • Esc to cancel
          </div>
        </div>

        {/* Selected Labels Summary */}
        {selectedLabels.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {selectedLabels.map((labelName) => {
                const label = labels.find(l => l.name === labelName)
                const labelColor = label ? getTodoistColor(label.color) : '#299fe6'
                return (
                  <span
                    key={labelName}
                    className="text-xs px-2 py-1 rounded-full flex items-center space-x-1"
                    style={{ backgroundColor: `${labelColor}20`, color: labelColor }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: labelColor }}
                    ></div>
                    <span>{labelName}</span>
                    <button
                      onClick={() => toggleLabel(labelName)}
                      className="ml-1 hover:scale-125 transition-transform"
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Labels List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredLabels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? `No labels found for "${searchTerm}"` : 'No labels available'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLabels.map((label, index) => {
                const isSelected = index === selectedIndex
                const isChecked = selectedLabels.includes(label.name)
                const labelColor = getTodoistColor(label.color)
                
                return (
                  <button
                    key={label.id}
                    ref={isSelected ? selectedLabelRef : null}
                    onClick={() => toggleLabel(label.name)}
                    className={`
                      w-full text-left p-3 rounded-md transition-all duration-150 flex items-center space-x-3 border
                      ${isSelected 
                        ? 'bg-green-50 border-green-300' 
                        : isChecked
                        ? 'bg-gray-50 border-gray-200'
                        : 'hover:bg-gray-50 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by button click
                        className="w-4 h-4 rounded focus:ring-green-500"
                        style={{ accentColor: labelColor }}
                      />
                    </div>
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: labelColor }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">
                        {label.name}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="text-xs font-bold text-green-500">
                        ↵
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}