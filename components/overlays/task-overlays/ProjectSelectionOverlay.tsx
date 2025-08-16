'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TodoistTask, TodoistProject } from '@/lib/types'
import { ProjectSuggestion } from '@/lib/suggestions-cache'
import { parseTodoistLinks } from '@/lib/todoist-link-parser'
import { ChevronRight, Plus, Palette } from 'lucide-react'

interface ProjectSelectionOverlayProps {
  projects: TodoistProject[]
  currentProjectId: string
  currentTask: TodoistTask
  suggestions: ProjectSuggestion[]
  onProjectSelect: (projectId: string) => void
  onClose: () => void
  isVisible: boolean
  onProjectsUpdate?: (updater: (projects: TodoistProject[]) => TodoistProject[]) => void
}

export default function ProjectSelectionOverlay({ 
  projects, 
  currentProjectId, 
  currentTask,
  suggestions,
  onProjectSelect, 
  onClose, 
  isVisible,
  onProjectsUpdate
}: ProjectSelectionOverlayProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined)
  const [selectedColor, setSelectedColor] = useState<string>('charcoal')
  const [isSelectingParent, setIsSelectingParent] = useState(false)
  const [isSelectingColor, setIsSelectingColor] = useState(false)
  const [parentSelectorIndex, setParentSelectorIndex] = useState(0)
  const [colorSelectorIndex, setColorSelectorIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedProjectRef = useRef<HTMLButtonElement>(null)
  const parentProjectRef = useRef<HTMLButtonElement>(null)
  const colorButtonRef = useRef<HTMLButtonElement>(null)

  const colorOptions = [
    { name: 'berry_red', hex: '#b8256f' },
    { name: 'red', hex: '#db4035' },
    { name: 'orange', hex: '#ff9933' },
    { name: 'yellow', hex: '#fad000' },
    { name: 'olive_green', hex: '#afb83b' },
    { name: 'lime_green', hex: '#7ecc49' },
    { name: 'green', hex: '#299438' },
    { name: 'mint_green', hex: '#6accbc' },
    { name: 'teal', hex: '#158fad' },
    { name: 'sky_blue', hex: '#14aaf5' },
    { name: 'light_blue', hex: '#96c3eb' },
    { name: 'blue', hex: '#4073ff' },
    { name: 'grape', hex: '#884dff' },
    { name: 'violet', hex: '#af38eb' },
    { name: 'lavender', hex: '#eb96eb' },
    { name: 'magenta', hex: '#e05194' },
    { name: 'salmon', hex: '#ff8d85' },
    { name: 'charcoal', hex: '#808080' },
    { name: 'grey', hex: '#b8b8b8' },
    { name: 'taupe', hex: '#ccac93' }
  ]

  const getTodoistColor = (colorName: string) => {
    const color = colorOptions.find(c => c.name === colorName)
    return color?.hex || '#299fe6'
  }
  
  // Helper to calculate project depth
  const getProjectDepth = (projectId: string): number => {
    let depth = 0
    let currentProject = projects.find(p => p.id === projectId)
    while (currentProject?.parentId) {
      depth++
      currentProject = projects.find(p => p.id === currentProject!.parentId)
    }
    return depth
  }
  
  // Build parent options with proper hierarchy and filtering
  const buildParentOptions = () => {
    const options: Array<{id?: string, name: string, color?: string, level: number, isNoParent?: boolean}> = []
    
    // Add "No parent" option
    options.push({ name: 'No parent (top-level project)', level: 0, isNoParent: true })
    
    // Add all projects with proper hierarchy, filtering out those at max depth
    const addProjectAndChildren = (project: TodoistProject, level: number) => {
      const projectDepth = getProjectDepth(project.id)
      // Todoist allows max 4 levels (0, 1, 2, 3), so projects at depth 3 can't be parents
      if (projectDepth < 3) {
        options.push({ id: project.id, name: project.name, color: project.color, level })
      }
      
      // Find and add children
      const children = projects.filter(p => p.parentId === project.id)
      children.forEach(child => addProjectAndChildren(child, level + 1))
    }
    
    // Start with root projects
    const rootProjects = projects.filter(p => !p.parentId)
    rootProjects.forEach(project => addProjectAndChildren(project, 0))
    
    return options
  }

  // Build project hierarchy with suggestions integrated
  const buildProjectHierarchy = () => {
    const projectMap = new Map(projects.map(p => [p.id, p]))
    const rootProjects = projects.filter(p => !p.parentId)
    const result: Array<(TodoistProject & { level: number; isSuggested?: boolean; confidence?: number; isAlsoSuggested?: boolean }) | { divider: true } | { createNew: true }> = []
    
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
    
    // Add "Create new project" option if search term exists and doesn't match any project
    if (searchTerm && !result.some(item => 
      !('divider' in item) && !('createNew' in item) && 
      item.name.toLowerCase() === searchTerm.toLowerCase()
    )) {
      // Add divider if there are existing results
      if (result.length > 0) {
        result.push({ divider: true } as any)
      }
      result.push({ createNew: true } as any)
    }
    
    return result
  }
  
  const filteredProjects = buildProjectHierarchy()

  // Reset when opening
  useEffect(() => {
    if (isVisible) {
      setSearchTerm('')
      setSelectedIndex(0)
      setIsSelectingParent(false)
      setIsSelectingColor(false)
      setSelectedParentId(undefined)
      setSelectedColor('charcoal')
      setIsCreatingProject(false)
      setParentSelectorIndex(0)
      setColorSelectorIndex(0)
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
          if ('divider' in item || 'createNew' in item) return false
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

  const handleProjectSelect = useCallback((projectId: string) => {
    onProjectSelect(projectId)
  }, [onProjectSelect])

  const handleCreateProject = useCallback(async () => {
    if (!searchTerm.trim()) return
    
    try {
      setIsCreatingProject(true)
      
      const response = await fetch('/api/todoist/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: searchTerm.trim(),
          parentId: selectedParentId,
          color: selectedColor,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const newProject = await response.json()
      
      // Update the local projects list with the new project
      if (onProjectsUpdate) {
        onProjectsUpdate((prevProjects) => [...prevProjects, newProject])
      }
      
      // Select the newly created project
      handleProjectSelect(newProject.id)
    } catch (error) {
      console.error('Error creating project:', error)
      // Could show an error toast here
    } finally {
      setIsCreatingProject(false)
    }
  }, [searchTerm, selectedParentId, selectedColor, handleProjectSelect, onProjectsUpdate])

  // Auto-scroll parent selector
  useEffect(() => {
    if (isSelectingParent && parentProjectRef.current) {
      parentProjectRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [parentSelectorIndex, isSelectingParent])
  
  // Auto-scroll color selector
  useEffect(() => {
    if (isSelectingColor && colorButtonRef.current) {
      colorButtonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [colorSelectorIndex, isSelectingColor])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle parent selector navigation
      if (isSelectingParent) {
        const parentOptions = buildParentOptions()
        
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault()
            setParentSelectorIndex(prev => Math.min(prev + 1, parentOptions.length - 1))
            break
          case 'ArrowUp':
            e.preventDefault()
            setParentSelectorIndex(prev => Math.max(prev - 1, 0))
            break
          case 'Enter':
            e.preventDefault()
            const selectedOption = parentOptions[parentSelectorIndex]
            if (selectedOption.isNoParent) {
              setSelectedParentId(undefined)
              setSelectedColor('charcoal') // Default color for top-level
            } else {
              setSelectedParentId(selectedOption.id)
              setSelectedColor(selectedOption.color || 'charcoal')
            }
            setIsSelectingParent(false)
            setIsSelectingColor(true)
            // Find the index of the current color in colorOptions
            const colorIndex = colorOptions.findIndex(c => c.name === (selectedOption.color || 'charcoal'))
            setColorSelectorIndex(colorIndex >= 0 ? colorIndex : 0)
            break
          case 'Escape':
            e.preventDefault()
            setIsSelectingParent(false)
            setParentSelectorIndex(0)
            break
        }
        return
      }
      
      // Handle color selector navigation
      if (isSelectingColor) {
        switch (e.key) {
          case 'ArrowRight':
            e.preventDefault()
            setColorSelectorIndex(prev => (prev + 1) % colorOptions.length)
            break
          case 'ArrowLeft':
            e.preventDefault()
            setColorSelectorIndex(prev => (prev - 1 + colorOptions.length) % colorOptions.length)
            break
          case 'ArrowDown':
            e.preventDefault()
            // 5 columns per row
            setColorSelectorIndex(prev => Math.min(prev + 5, colorOptions.length - 1))
            break
          case 'ArrowUp':
            e.preventDefault()
            // 5 columns per row
            setColorSelectorIndex(prev => Math.max(prev - 5, 0))
            break
          case 'Enter':
            e.preventDefault()
            if (colorOptions[colorSelectorIndex]) {
              setSelectedColor(colorOptions[colorSelectorIndex].name)
              setIsSelectingColor(false)
              handleCreateProject()
            }
            break
          case 'Escape':
            e.preventDefault()
            setIsSelectingColor(false)
            setIsSelectingParent(true)
            break
        }
        return
      }
      
      // Handle regular project list navigation
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
            if ('createNew' in selected) {
              // Show parent selector if not already selecting
              if (!isSelectingParent && !isSelectingColor) {
                setIsSelectingParent(true)
                setParentSelectorIndex(0)
              } else if (isSelectingColor) {
                // Confirm color and create project
                setIsSelectingColor(false)
                handleCreateProject()
              }
            } else {
              handleProjectSelect(selected.id)
            }
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
          // If in color selection, go back to parent selection
          if (isSelectingColor) {
            setIsSelectingColor(false)
            setIsSelectingParent(true)
          }
          // If in parent selection, go back to project list
          else if (isSelectingParent) {
            setIsSelectingParent(false)
          }
          // Otherwise close the overlay
          else {
            onClose()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, selectedIndex, filteredProjects, isSelectingParent, isSelectingColor, handleCreateProject, projects, parentSelectorIndex, colorSelectorIndex, buildParentOptions, colorOptions])

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
            {parseTodoistLinks(currentTask.content).map((segment, index) => {
              if (segment.type === 'text') {
                return <span key={index}>{segment.content}</span>
              } else {
                return (
                  <a
                    key={index}
                    href={segment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:text-blue-800 underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {segment.content}
                  </a>
                )
              }
            })}
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
                
                // Handle create new project option
                if ('createNew' in item) {
                  const isSelected = index === selectedIndex
                  
                  // Show parent selector
                  if (isSelectingParent) {
                    const parentOptions = buildParentOptions()
                    const selectedParentOption = parentOptions[parentSelectorIndex]
                    
                    return (
                      <div key="parent-selector" className="p-4 space-y-4">
                        <div className="text-sm font-medium text-gray-700">Select parent project for &quot;{searchTerm}&quot;</div>
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                          {parentOptions.map((option, idx) => {
                            const isSelected = idx === parentSelectorIndex
                            const isCurrentlySelected = option.isNoParent ? !selectedParentId : option.id === selectedParentId
                            
                            return (
                              <button
                                key={option.id || 'no-parent'}
                                ref={isSelected ? parentProjectRef : null}
                                onClick={() => {
                                  if (option.isNoParent) {
                                    setSelectedParentId(undefined)
                                  } else {
                                    setSelectedParentId(option.id)
                                    setSelectedColor(option.color || 'charcoal')
                                    // Find the index of the current color in colorOptions
                                    const colorIndex = colorOptions.findIndex(c => c.name === (option.color || 'charcoal'))
                                    setColorSelectorIndex(colorIndex >= 0 ? colorIndex : 0)
                                  }
                                  setIsSelectingParent(false)
                                  setIsSelectingColor(true)
                                }}
                                className={`
                                  w-full text-left p-2.5 rounded-md transition-all duration-150 flex items-center gap-2 border
                                  ${isSelected
                                    ? 'bg-blue-50 border-blue-300' 
                                    : isCurrentlySelected
                                    ? 'bg-green-50 border-green-200'
                                    : 'hover:bg-gray-50 border-transparent'
                                  }
                                `}
                                style={{ paddingLeft: `${0.75 + option.level * 1.5}rem` }}
                              >
                                {option.level > 0 && (
                                  <div className="flex items-center text-gray-400 -ml-2">
                                    {'└'.padStart(option.level * 2, '  ')}
                                  </div>
                                )}
                                {!option.isNoParent && (
                                  <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getTodoistColor(option.color || 'charcoal') }}
                                  />
                                )}
                                <span className={option.isNoParent ? 'text-gray-500' : 'text-gray-900'}>
                                  {option.name}
                                </span>
                                {isCurrentlySelected && (
                                  <span className="ml-auto text-xs text-green-600">✓ Selected</span>
                                )}
                                {isSelected && (
                                  <span className="ml-auto text-xs text-blue-500 font-bold">↵</span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                        <div className="text-xs text-gray-500 pt-2 border-t">
                          ↑↓ to navigate • Enter to select • Esc to go back
                        </div>
                      </div>
                    )
                  }
                  
                  // Show color selector
                  if (isSelectingColor) {
                    return (
                      <div key="color-selector" className="p-4 space-y-4">
                        <div className="text-sm font-medium text-gray-700">
                          Select color for &quot;{searchTerm}&quot;
                          {selectedParentId && (
                            <span className="text-gray-500 text-xs block mt-1">
                              Parent: {projects.find(p => p.id === selectedParentId)?.name}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                          {colorOptions.map((color, idx) => {
                            const isSelected = idx === colorSelectorIndex
                            const isCurrentColor = color.name === selectedColor
                            
                            return (
                              <button
                                key={color.name}
                                ref={isSelected ? colorButtonRef : null}
                                onClick={() => {
                                  setSelectedColor(color.name)
                                  setColorSelectorIndex(idx)
                                }}
                                onMouseEnter={() => setColorSelectorIndex(idx)}
                                className={`
                                  relative w-full aspect-square rounded-full transition-all
                                  ${isSelected
                                    ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' 
                                    : isCurrentColor
                                    ? 'ring-2 ring-green-500 ring-offset-2'
                                    : 'hover:scale-110 hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                                  }
                                `}
                                style={{ backgroundColor: color.hex }}
                                title={color.name.replace(/_/g, ' ')}
                              >
                                {(isCurrentColor || isSelected) && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white text-sm font-bold drop-shadow">
                                      {isCurrentColor ? '✓' : ''}
                                    </span>
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                        <div className="pt-2 border-t space-y-2">
                          <div className="text-xs text-gray-500 text-center">
                            ←→↑↓ to navigate • Enter to create • Esc to go back
                          </div>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                setIsSelectingColor(false)
                                setIsSelectingParent(true)
                                setParentSelectorIndex(0)
                              }}
                              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            >
                              <span className="text-lg">←</span> Back to parent
                            </button>
                          <button
                            onClick={() => {
                              handleCreateProject()
                            }}
                            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                            disabled={isCreatingProject}
                          >
                            {isCreatingProject ? 'Creating...' : 'Create Project'}
                          </button>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <button
                      key="create-new"
                      ref={isSelected ? selectedProjectRef : null}
                      onClick={() => {
                        if (!isSelectingParent && !isSelectingColor) {
                          setIsSelectingParent(true)
                        }
                      }}
                      className={`
                        w-full text-left p-2.5 rounded-md transition-all duration-150 flex items-center space-x-2 border
                        ${isSelected 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'hover:bg-gray-50 border-transparent'
                        }
                        ${isCreatingProject ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex-shrink-0">
                        <Plus className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          Create &quot;{searchTerm}&quot; as new project
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Press Enter to select parent and color
                        </div>
                      </div>
                      {isSelected && (
                        <div className="text-xs font-bold text-blue-500">
                          ↵
                        </div>
                      )}
                    </button>
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
                      w-full text-left p-2.5 rounded-md transition-all duration-150 flex items-center border
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
                    style={{ paddingLeft: `${0.75 + project.level * 1.5}rem` }}
                  >
                    <div className="flex items-center gap-2">
                      {project.level > 0 && !project.isSuggested && (
                        <div className="flex items-center text-gray-400 -ml-1">
                          {'└'.padStart(project.level * 2, '  ')}
                        </div>
                      )}
                      {project.isSuggested && (
                        <div className="flex items-center justify-center w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex-shrink-0">
                          <span className="text-[8px] font-bold text-white">AI</span>
                        </div>
                      )}
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: projectColor }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 ml-2">
                      <div className={`font-medium text-sm ${
                        isCurrent ? 'text-green-800' : 'text-gray-900'
                      }`}>
                        {project.name}
                        {isCurrent && <span className="ml-2 text-xs text-green-600">✓ Current</span>}
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
                      <div className="text-xs font-bold text-blue-500 ml-2">
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