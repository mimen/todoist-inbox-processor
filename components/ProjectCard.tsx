'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { TodoistProject } from '@/lib/types'

interface ProjectWithDescription extends TodoistProject {
  description: string
}

interface ProjectCardProps {
  project: ProjectWithDescription
  nestingDepth?: number
  onDescriptionChange?: (projectId: string, newDescription: string) => void
}

export default function ProjectCard({ project, nestingDepth = 0, onDescriptionChange }: ProjectCardProps) {
  const [description, setDescription] = useState(project.description)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  // Update local state when project changes
  useEffect(() => {
    setDescription(project.description)
  }, [project.id, project.description])

  // Auto-save with debounce
  const debouncedSave = useCallback((value: string) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    
    const timeout = setTimeout(() => {
      if (value !== project.description && onDescriptionChange) {
        onDescriptionChange(project.id, value)
      }
    }, 1000)
    
    setSaveTimeout(timeout)
  }, [saveTimeout, project.description, project.id, onDescriptionChange])

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value
    setDescription(newDescription)
    debouncedSave(newDescription)
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
      debouncedSave(data.suggestion)
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

  const projectColor = getTodoistColor(project.color)
  const isNested = nestingDepth > 0
  const leftMargin = nestingDepth * 32 // 32px per level of nesting

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border p-6 transition-all hover:shadow-md ${isNested ? 'border-l-4' : ''}`}
      style={{ 
        marginLeft: `${leftMargin}px`,
        ...(isNested ? { borderLeftColor: projectColor } : {})
      }}>
      
      {/* Project Header */}
      <div className="flex items-center gap-3 mb-4">
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
        
        {/* Badges */}
        <div className="flex items-center gap-2">
          {nestingDepth > 0 && (
            <span className="px-2 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              Level {nestingDepth}
            </span>
          )}
          {project.isInboxProject && (
            <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Inbox
            </span>
          )}
        </div>
      </div>

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
          className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed"
          placeholder="Add a description for this project..."
          rows={3}
        />
        
        {suggestionError && (
          <p className="mt-2 text-xs text-red-600">{suggestionError}</p>
        )}
        
        <p className="mt-2 text-xs text-gray-500">
          Descriptions are stored as special tasks with "*" prefix and auto-save after 1 second.
        </p>
      </div>

      {/* Project Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>
          {project.isShared ? 'Shared Project' : 'Personal Project'}
        </span>
        <span>ID: {project.id}</span>
      </div>
    </div>
  )
}