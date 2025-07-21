'use client'

import { useState, useEffect, useRef } from 'react'
import { TodoistProject } from '@/lib/types'

interface ProjectDropdownProps {
  projects: TodoistProject[]
  selectedProjectId: string
  onProjectChange: (projectId: string) => void
  placeholder?: string
  includeInbox?: boolean
  className?: string
  allTasks?: any[] // Optional: all tasks for client-side counting
}

export default function ProjectDropdown({ 
  projects, 
  selectedProjectId, 
  onProjectChange,
  placeholder = "Select project...",
  includeInbox = true,
  className = "",
  allTasks = []
}: ProjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [taskCounts, setTaskCounts] = useState<{ [key: string]: number }>({})
  const loadingCounts = allTasks.length === 0 // Show loading state until we have data
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Calculate task counts when projects or allTasks change
  useEffect(() => {
    if (projects.length > 0 && allTasks.length > 0) {
      calculateTaskCounts()
    }
  }, [projects.length, allTasks.length])

  const calculateTaskCounts = () => {
    const counts: { [key: string]: number } = {}
    
    console.log('Calculating task counts:', {
      totalTasks: allTasks.length,
      totalProjects: projects.length,
      sampleTask: allTasks[0],
      sampleProject: projects[0]
    })
    
    // Calculate counts for each project
    projects.forEach(project => {
      const projectTasks = allTasks.filter((task: any) => 
        String(task.projectId) === String(project.id) && !task.content.startsWith('* ')
      )
      counts[project.id] = projectTasks.length
      if (projectTasks.length > 0) {
        console.log(`Project ${project.name} (${project.id}): ${projectTasks.length} tasks`)
      }
    })
    
    // Handle inbox
    if (includeInbox) {
      const inboxProject = projects.find(p => p.isInboxProject)
      if (inboxProject) {
        counts['inbox'] = counts[inboxProject.id] || 0
      }
    }
    
    setTaskCounts(counts)
  }


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

  // Create project hierarchy
  const createProjectHierarchy = () => {
    const rootProjects = projects.filter(p => !p.parentId && !p.isInboxProject)
    const childProjects = projects.filter(p => p.parentId && !p.isInboxProject)
    
    const hierarchy: any[] = []
    
    // Add inbox if requested
    if (includeInbox) {
      const inboxProject = projects.find(p => p.isInboxProject)
      hierarchy.push({
        id: inboxProject?.id || 'inbox',
        name: 'Inbox',
        color: inboxProject ? getTodoistColor(inboxProject.color) : '#299fe6',
        indent: 0
      })
    }
    
    // Add root projects and their children
    const addProjectWithChildren = (project: TodoistProject, indent: number = 0) => {
      hierarchy.push({
        id: project.id,
        name: project.name,
        color: getTodoistColor(project.color),
        indent
      })
      
      // Add children
      const children = childProjects.filter(p => p.parentId === project.id)
      children.forEach(child => addProjectWithChildren(child, indent + 1))
    }
    
    rootProjects.forEach(project => addProjectWithChildren(project))
    
    return hierarchy
  }

  const projectHierarchy = createProjectHierarchy()
  
  // Filter projects based on search term
  const filteredProjects = projectHierarchy.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedProject = projectHierarchy.find(p => p.id === selectedProjectId)

  const handleProjectSelect = (projectId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onProjectChange(projectId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleDropdownClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setSearchTerm(event.target.value)
  }

  const handleDropdownContainerClick = (event: React.MouseEvent) => {
    // Prevent any event bubbling from the dropdown container
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleDropdownClick}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
      >
        <div className="flex items-center space-x-3">
          {selectedProject ? (
            <>
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedProject.color }}
              ></div>
              <span className="font-medium text-gray-900">{selectedProject.name}</span>
              <span className="text-gray-500">
                ({taskCounts[selectedProjectId] || 0})
              </span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 dropdown-open"
          onClick={handleDropdownContainerClick}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-todoist-blue focus:border-transparent text-sm"
            />
          </div>
          
          {/* Project List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <button
                  type="button"
                  key={project.id}
                  onClick={(e) => handleProjectSelect(project.id, e)}
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedProjectId === project.id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                  }`}
                  style={{ paddingLeft: `${12 + (project.indent * 20)}px` }}
                >
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  ></div>
                  <div className="flex-1 flex items-center space-x-2">
                    <span className="font-medium">{project.name}</span>
                    {loadingCounts ? (
                      <span className="text-xs text-gray-400">...</span>
                    ) : (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {taskCounts[project.id] || 0}
                      </span>
                    )}
                  </div>
                  {selectedProjectId === project.id && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500 text-sm">
                No projects found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}