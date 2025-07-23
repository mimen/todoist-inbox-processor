'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TodoistTask, TodoistProject } from '@/lib/types'
import { ProjectSuggestion } from '@/lib/suggestions-cache'

interface ProjectSelectionOverlayProps {
  projects: TodoistProject[]
  currentProjectId: string
  currentTask: TodoistTask
  suggestions: ProjectSuggestion[]
  onProjectSelect: (projectId: string) => void
  onClose: () => void
  isVisible: boolean
}

export default function ProjectSelectionOverlay({ 
  projects, 
  currentProjectId, 
  currentTask,
  suggestions,
  onProjectSelect, 
  onClose, 
  isVisible 
}: ProjectSelectionOverlayProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedProjectRef = useRef<HTMLButtonElement>(null)

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

  // Build project hierarchy with suggestions integrated
  const buildProjectHierarchy = () => {
    const projectMap = new Map(projects.map(p => [p.id, p]))
    const rootProjects = projects.filter(p => !p.parentId)
    const result: Array<(TodoistProject & { level: number; isSuggested?: boolean; confidence?: number; isAlsoSuggested?: boolean }) | { divider: true }> = []
    
    // Track which projects are suggested for marking duplicates
    const suggestedIds = new Set(suggestions.map(s => s.projectId))
    
    // Add suggested projects at the top (only if they match search or no search)
    if (suggestions.length > 0) {
      let addedSuggestions = 0
      suggestions.forEach(suggestion => {
        const project = projects.find(p => p.id === suggestion.projectId)
        if (project) {
          // Only show suggestion if it matches search term (or no search term)
          if (!searchTerm || project.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            result.push({ 
              ...project, 
              level: 0, 
              isSuggested: true, 
              confidence: suggestion.confidence 
            })
            addedSuggestions++
          }
        }
      })
      
      // Only add divider if we actually added suggestions
      if (addedSuggestions > 0) {
        result.push({ divider: true } as any)
      }
    }
    
    // Build a set of all projects that match the search term
    const matchingProjectIds = new Set<string>()
    const findMatchingProjects = (project: TodoistProject) => {
      if (project.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        matchingProjectIds.add(project.id)
      }
      const children = projects.filter(p => p.parentId === project.id)
      children.forEach(findMatchingProjects)
    }
    
    if (searchTerm) {
      projects.forEach(findMatchingProjects)
    }
    
    // Find all ancestor projects of matching projects
    const projectsToShow = new Set<string>(matchingProjectIds)
    if (searchTerm) {
      matchingProjectIds.forEach(projectId => {
        let currentProject = projectMap.get(projectId)
        while (currentProject?.parentId) {
          projectsToShow.add(currentProject.parentId)
          currentProject = projectMap.get(currentProject.parentId)
        }
      })
    }
    
    const addProjectWithChildren = (project: TodoistProject, level: number) => {
      // Show project if: no search term, it matches, or it's an ancestor of a match
      const shouldShow = !searchTerm || projectsToShow.has(project.id)
      
      if (shouldShow) {
        // Mark if this project is also shown as a suggestion
        const isAlsoSuggested = suggestedIds.has(project.id)
        result.push({ ...project, level, isAlsoSuggested })
      }
      
      // Always recurse to children to maintain hierarchy
      const children = projects.filter(p => p.parentId === project.id)
      children.forEach(child => addProjectWithChildren(child, level + 1))
    }
    
    rootProjects.forEach(project => addProjectWithChildren(project, 0))
    return result
  }
  
  const filteredProjects = buildProjectHierarchy()

  // Reset when opening
  useEffect(() => {
    if (isVisible) {
      setSearchTerm('')
      setSelectedIndex(0)
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
    }
  }, [isVisible])

  // Set initial selection to first matching item only when starting to search
  useEffect(() => {
    if (searchTerm && filteredProjects.length > 0) {
      // Only auto-select if we're at index 0 (haven't navigated yet)
      if (selectedIndex === 0) {
        // Find the first non-divider item that actually matches the search
        const firstMatchIndex = filteredProjects.findIndex(item => {
          if ('divider' in item) return false
          // Check if this is a matching project (not just a parent shown for context)
          return item.name.toLowerCase().includes(searchTerm.toLowerCase())
        })
        
        if (firstMatchIndex >= 0 && firstMatchIndex !== 0) {
          setSelectedIndex(firstMatchIndex)
        }
      }
    }
  }, [searchTerm, filteredProjects.length]) // Remove filteredProjects dependency to avoid re-running

  // Update selected index when filtered projects change
  useEffect(() => {
    if (selectedIndex >= filteredProjects.length) {
      setSelectedIndex(Math.max(0, filteredProjects.length - 1))
    }
  }, [filteredProjects.length, selectedIndex])

  // Auto-scroll to keep selected project in view
  useEffect(() => {
    if (selectedProjectRef.current) {
      selectedProjectRef.current.scrollIntoView({
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
          setSelectedIndex(prev => {
            let next = Math.min(prev + 1, filteredProjects.length - 1)
            // Skip dividers
            while (next < filteredProjects.length && 'divider' in filteredProjects[next]) {
              next++
            }
            return Math.min(next, filteredProjects.length - 1)
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => {
            let next = Math.max(prev - 1, 0)
            // Skip dividers
            while (next >= 0 && 'divider' in filteredProjects[next]) {
              next--
            }
            return Math.max(next, 0)
          })
          break
        case 'Enter':
          e.preventDefault()
          const selected = filteredProjects[selectedIndex]
          if (selected && !('divider' in selected)) {
            handleProjectSelect(selected.id)
          }
          break
        case 'Delete':
        case 'Backspace':
          if (e.shiftKey) {
            e.preventDefault()
            // Set to inbox project
            const inboxProject = projects.find(p => p.isInboxProject)
            if (inboxProject) {
              handleProjectSelect(inboxProject.id)
            }
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
  }, [isVisible, selectedIndex, filteredProjects])

  const handleProjectSelect = useCallback((projectId: string) => {
    onProjectSelect(projectId)
  }, [onProjectSelect])

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
        <div className="p-6 border-b border-gray-200 bg-blue-50 rounded-t-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">#</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-blue-900">Select Project</h2>
            </div>
          </div>
          <h3 className="text-sm font-medium text-blue-900 leading-tight">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="Search projects..."
          />
          <div className="mt-2 text-sm text-gray-500">
            ↑↓ to navigate • Enter to select • Esc to cancel
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? `No projects found for "${searchTerm}"` : 'No projects available'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredProjects.map((item, index) => {
                // Handle divider
                if ('divider' in item) {
                  return (
                    <div key={`divider-${index}`} className="my-2 border-t border-gray-200" />
                  )
                }
                
                const project = item
                const isSelected = index === selectedIndex
                const isCurrent = project.id === currentProjectId
                const projectColor = getTodoistColor(project.color)
                const isMatch = searchTerm && project.name.toLowerCase().includes(searchTerm.toLowerCase())
                const isContextOnly = searchTerm && !isMatch && !project.isSuggested
                
                return (
                  <button
                    key={project.isSuggested ? `ai-${project.id}` : project.id}
                    ref={isSelected ? selectedProjectRef : null}
                    onClick={() => handleProjectSelect(project.id)}
                    className={`
                      w-full text-left p-3 rounded-md transition-all duration-150 flex items-center space-x-3 border
                      ${isSelected 
                        ? 'bg-blue-50 border-blue-300' 
                        : isCurrent
                        ? 'bg-green-50 border-green-200'
                        : project.isSuggested
                        ? 'hover:bg-indigo-50 border-transparent'
                        : 'hover:bg-gray-50 border-transparent'
                      }
                      ${isContextOnly ? 'opacity-60' : ''}
                    `}
                    style={{ paddingLeft: `${1 + project.level * 1.5}rem` }}
                  >
                    {project.level > 0 && !project.isSuggested && (
                      <div className="flex items-center text-gray-400 -ml-2">
                        {'└'.padStart(project.level * 2, '  ')}
                      </div>
                    )}
                    {project.isSuggested && (
                      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex-shrink-0">
                        <span className="text-[10px] font-bold text-white">AI</span>
                      </div>
                    )}
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: projectColor }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${
                        isCurrent ? 'text-green-800' : 'text-gray-900'
                      }`}>
                        {project.name}
                        {isCurrent && <span className="ml-2 text-green-600">✓ Current</span>}
                        {project.isAlsoSuggested && (
                          <span className="ml-2 text-xs text-indigo-600">AI suggested</span>
                        )}
                        {project.isSuggested && project.confidence && (
                          <span className={`ml-2 text-xs ${
                            project.confidence >= 0.8 ? 'text-green-600' :
                            project.confidence >= 0.6 ? 'text-yellow-600' :
                            'text-gray-500'
                          }`}>
                            {Math.round(project.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="text-xs font-bold text-blue-500">
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