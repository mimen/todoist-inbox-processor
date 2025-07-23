'use client'

import { useState, useCallback, useRef, useEffect, forwardRef } from 'react'

interface SmartScheduleDateInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Common natural language patterns that Todoist recognizes
const RECOGNIZED_PATTERNS = [
  // Relative dates
  /\b(today|tomorrow|yesterday)\b/gi,
  /\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|year)\b/gi,
  /\bin\s+(\d+)\s+(day|week|month|year)s?\b/gi,
  /\b(\d+)\s+(day|week|month|year)s?\s+(from\s+now|later)\b/gi,
  
  // Specific dates
  /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s+(\d{1,2})\b/gi,
  /\b(\d{1,2})\/(\d{1,2})(\/\d{2,4})?\b/gi,
  /\b(\d{1,2})-(\d{1,2})(-\d{2,4})?\b/gi,
  
  // Times
  /\b(at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?\b/gi,
  /\b(at\s+)?(\d{1,2})\s*(am|pm)\b/gi,
  /\b(morning|afternoon|evening|night|noon|midnight)\b/gi,
  
  // Days of week
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi,
  
  // Special keywords
  /\b(end\s+of\s+(week|month|year)|beginning\s+of\s+(week|month|year))\b/gi,
  /\b(every\s+(day|week|month|year)|daily|weekly|monthly|yearly)\b/gi,
]

const SmartScheduleDateInput = forwardRef<HTMLInputElement, SmartScheduleDateInputProps>(function SmartScheduleDateInput({ value, onChange, placeholder = "e.g., tomorrow, next friday, in 2 weeks..." }, ref) {
  const [highlightedText, setHighlightedText] = useState<JSX.Element[]>([])
  const internalRef = useRef<HTMLInputElement>(null)
  const inputRef = ref || internalRef
  
  const highlightText = useCallback((text: string) => {
    if (!text) {
      setHighlightedText([])
      return
    }

    let lastIndex = 0
    const parts: JSX.Element[] = []
    const matches: Array<{ start: number; end: number; match: string }> = []
    
    // Find all matches
    RECOGNIZED_PATTERNS.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          match: match[0]
        })
      }
    })
    
    // Sort matches by position and remove overlaps
    matches.sort((a, b) => a.start - b.start)
    const validMatches = matches.filter((match, index) => {
      if (index === 0) return true
      const prevMatch = matches[index - 1]
      return match.start >= prevMatch.end
    })
    
    // Build highlighted text
    validMatches.forEach((match, index) => {
      // Add text before match
      if (match.start > lastIndex) {
        parts.push(
          <span key={`text-${index}`} className="text-gray-900">
            {text.slice(lastIndex, match.start)}
          </span>
        )
      }
      
      // Add highlighted match
      parts.push(
        <span 
          key={`match-${index}`} 
          className="bg-blue-100 text-blue-800 px-1 rounded font-medium"
        >
          {match.match}
        </span>
      )
      
      lastIndex = match.end
    })
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key="remaining" className="text-gray-900">
          {text.slice(lastIndex)}
        </span>
      )
    }
    
    setHighlightedText(parts)
  }, [])
  
  useEffect(() => {
    highlightText(value)
  }, [value, highlightText])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    highlightText(newValue)
  }
  
  const hasRecognizedPatterns = highlightedText.some(part => 
    part.props.className?.includes('bg-blue-100')
  )
  
  return (
    <div className="relative">
      <div className="relative">
        {/* Invisible overlay showing highlighted text */}
        <div 
          className="absolute inset-0 px-3 py-2 pointer-events-none whitespace-pre-wrap break-words text-transparent border border-transparent"
          style={{ 
            font: 'inherit',
            lineHeight: 'inherit',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
        >
          {highlightedText.length > 0 ? highlightedText : (
            <span className="text-gray-400">{value ? '' : placeholder}</span>
          )}
        </div>
        
        {/* Actual input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-todoist-blue focus:border-transparent bg-transparent relative z-10"
          placeholder={placeholder}
          style={{ color: 'transparent' }}
        />
      </div>
      
      {/* Status indicator */}
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          Use natural language like "tomorrow", "next Friday", "in 2 weeks"
        </span>
        {value && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            hasRecognizedPatterns 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {hasRecognizedPatterns ? '✓ Recognized' : '⚠ May not parse correctly'}
          </span>
        )}
      </div>
    </div>
  )
})

export default SmartScheduleDateInput