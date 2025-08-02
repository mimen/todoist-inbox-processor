'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { TodoistProject } from '@/lib/types'

interface ProjectWithMetadata extends TodoistProject {
  description: string
  category: 'area' | 'project' | null
  priority: 1 | 2 | 3 | 4 | null
  due?: { date: string; string: string }
  deadline?: { date: string; string: string }
}

interface EnhancedProjectCardProps {
  project: ProjectWithMetadata
  nestingDepth?: number
  isCollapsed?: boolean
  onMetadataChange?: (projectId: string, metadata: {
    description?: string
    category?: 'area' | 'project' | null
    priority?: 1 | 2 | 3 | 4 | null
    dueString?: string
    deadline?: string
  }) => void
}

export default function EnhancedProjectCard({ 
  project, 
  nestingDepth = 0, 
  isCollapsed = false,
  onMetadataChange 
}: EnhancedProjectCardProps) {
  const [description, setDescription] = useState(project.description)
  const [category, setCategory] = useState<'area' | 'project' | null>(project.category)
  const [priority, setPriority] = useState<1 | 2 | 3 | 4 | null>(project.priority)
  const [dueString, setDueString] = useState(project.due?.string || '')
  const [deadline, setDeadline] = useState(project.deadline?.string || '')
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const searchParams = useSearchParams()
  const isDebugMode = searchParams.get('debug') === 'true'

  // Update local state when project changes
  useEffect(() => {
    setDescription(project.description)
    setCategory(project.category)
    setPriority(project.priority)
    setDueString(project.due?.string || '')
    setDeadline(project.deadline?.string || '')
  }, [project])

  // Auto-save with debounce
  const debouncedSave = useCallback((metadata: any) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    
    const timeout = setTimeout(() => {
      if (onMetadataChange) {
        onMetadataChange(project.id, metadata)
      }
    }, 1000)
    
    setSaveTimeout(timeout)
  }, [saveTimeout, project.id, onMetadataChange])

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value
    setDescription(newDescription)
    debouncedSave({ description: newDescription })
  }

  const handleCategoryChange = (newCategory: 'area' | 'project' | null) => {
    setCategory(newCategory)
    debouncedSave({ category: newCategory })
  }

  const handlePriorityChange = (newPriority: 1 | 2 | 3 | 4 | null) => {
    setPriority(newPriority)
    debouncedSave({ priority: newPriority })
  }

  const handleDueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDueString = e.target.value
    setDueString(newDueString)
    debouncedSave({ dueString: newDueString })
  }

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDeadline = e.target.value
    setDeadline(newDeadline)
    debouncedSave({ deadline: newDeadline })
  }

  const generateSuggestion = useCallback(async () => {
    if (isGeneratingSuggestion) return
    
    setIsGeneratingSuggestion(true)
    setSuggestionError(null)
    
    try {
      const response = await fetch(`/api/projects/${project.id}/suggest-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentDescription: description,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate suggestion')
      }

      const data = await response.json()
      setDescription(data.suggestion)
      debouncedSave({ description: data.suggestion })
    } catch (err) {
      console.error('Error generating suggestion:', err)
      setSuggestionError(err instanceof Error ? err.message : 'Failed to generate suggestion')
    } finally {
      setIsGeneratingSuggestion(false)
    }
  }, [project.id, description, debouncedSave, isGeneratingSuggestion])

  // Auto-resize textarea
  useEffect(() => {
    const adjustHeight = () => {
      if (descriptionRef.current) {
        descriptionRef.current.style.height = 'auto'
        descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`
      }
    }
    adjustHeight()
  }, [description])

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

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'text-red-600 bg-red-50 border-red-200'
      case 3: return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 2: return 'text-blue-600 bg-blue-50 border-blue-200'
      case 1: return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-400 bg-gray-50 border-gray-200'
    }
  }

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'area': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'project': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-400 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityDisplayName = (priority: number) => {
    // Map internal priority values to display names
    // Internal: 4=P1, 3=P2, 2=P3, 1=P4
    switch (priority) {
      case 4: return 'P1'
      case 3: return 'P2'
      case 2: return 'P3'
      case 1: return 'P4'
      default: return `P${priority}`
    }
  }

  const projectColor = getTodoistColor(project.color)
  const isNested = nestingDepth > 0
  const leftMargin = nestingDepth * 32 // 32px per level of nesting

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border transition-all hover:shadow-md ${isNested ? 'border-l-4' : ''} ${isCollapsed ? 'p-4' : 'p-6'}`}
      style={{ 
        marginLeft: `${leftMargin}px`,
        ...(isNested ? { borderLeftColor: projectColor } : {})
      }}>
      
      {/* Project Header */}
      <div className={`flex items-center gap-3 ${isCollapsed ? 'mb-0' : 'mb-4'}`}>
        {/* Nesting indicator */}
        {isNested && (
          <div className="flex items-center">
            {Array.from({ length: nestingDepth }, (_, i) => (
              <div
                key={i}
                className="w-0.5 h-4 bg-gray-300 mr-2"
                style={{ backgroundColor: i === nestingDepth - 1 ? projectColor : '#e5e7eb' }}
              />
            ))}
          </div>
        )}
        
        <div 
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: projectColor }}
        ></div>
        <h2 className="text-xl font-semibold text-gray-900 flex-1">
          {project.name}
        </h2>
        
        {/* Badges and Controls */}
        <div className="flex items-center gap-2">
          {/* Priority Selection - Always visible */}
          <div className="flex gap-1">
            {[4, 3, 2, 1].map((p) => (
              <button
                key={p}
                onClick={() => handlePriorityChange(p === priority ? null : p as 1 | 2 | 3 | 4)}
                className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                  priority === p 
                    ? getPriorityColor(p as 1 | 2 | 3 | 4).replace('border', 'bg').replace('700', '100')
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
                title={`Set priority to ${getPriorityDisplayName(p as 1 | 2 | 3 | 4)}`}
              >
                {getPriorityDisplayName(p as 1 | 2 | 3 | 4)}
              </button>
            ))}
            {priority && (
              <button
                onClick={() => handlePriorityChange(null)}
                className="px-2 py-1 text-xs font-medium rounded-md border bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                title="Clear priority"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Other badges */}
          {category && (
            <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getCategoryColor(category)}`}>
              {category === 'area' ? 'Area' : 'Project'}
            </span>
          )}
          {nestingDepth > 0 && (
            <span className="px-2 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              L{nestingDepth}
            </span>
          )}
          {project.isInboxProject && (
            <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Inbox
            </span>
          )}
        </div>
      </div>

      {/* Expanded Content - Only show when not collapsed */}
      {!isCollapsed && (
        <>
          {/* Metadata Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Category Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Type
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleCategoryChange(category === 'area' ? null : 'area')}
              className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                category === 'area' 
                  ? 'bg-purple-100 text-purple-700 border-purple-300' 
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              Area of Responsibility
            </button>
            <button
              onClick={() => handleCategoryChange(category === 'project' ? null : 'project')}
              className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                category === 'project' 
                  ? 'bg-green-100 text-green-700 border-green-300' 
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              Project
            </button>
          </div>
        </div>

      </div>

      {/* Dates Section - Only show for Projects, not Areas */}
      {category === 'project' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Scheduled Date
            </label>
            <input
              type="text"
              value={dueString}
              onChange={handleDueChange}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., today, next week, Jan 15"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Deadline
            </label>
            <input
              type="text"
              value={deadline}
              onChange={handleDeadlineChange}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., end of month, Dec 31"
            />
          </div>
        </div>
      )}

      {/* Project Description */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <button
            onClick={generateSuggestion}
            disabled={isGeneratingSuggestion}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {isGeneratingSuggestion ? 'Generating...' : 'AI Suggest'}
          </button>
        </div>
        
        <textarea
          ref={descriptionRef}
          value={description}
          onChange={handleDescriptionChange}
          className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed text-gray-900"
          placeholder="Add a description for this project..."
          rows={3}
        />
        
        {suggestionError && (
          <p className="mt-2 text-xs text-red-600">{suggestionError}</p>
        )}
      </div>

          {/* Project Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
            <span>
              {project.isShared ? 'Shared Project' : 'Personal Project'}
            </span>
            <span>ID: {project.id}</span>
          </div>
          
          {/* Debug Mode */}
          {isDebugMode && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 font-mono"
                title="Toggle JSON debug view"
              >
                {showDebug ? 'Hide' : 'Show'} Project JSON
              </button>
            </div>
          )}
          
          {/* Debug JSON View */}
          {showDebug && isDebugMode && (
            <div className="mt-2 p-4 bg-gray-900 rounded-lg overflow-auto">
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                {JSON.stringify(project, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  )
}