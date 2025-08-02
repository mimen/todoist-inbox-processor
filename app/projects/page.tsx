'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { TodoistProject } from '@/lib/types'
import EnhancedProjectCard from '@/components/EnhancedProjectCard'
import DraggableProjectCard from '@/components/DraggableProjectCard'
import PriorityDropZone from '@/components/PriorityDropZone'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core'

interface ProjectWithMetadata extends TodoistProject {
  description: string
  category: 'area' | 'project' | null
  priority: 1 | 2 | 3 | 4 | null
  due?: { date: string; string: string }
  deadline?: { date: string; string: string }
}

type FilterType = 'all' | 'without-descriptions' | 'areas' | 'projects' | 'no-type' | 'need-priority' | 'need-dates'
type SortType = 'order' | 'name' | 'priority' | 'priority-grouped' | 'scheduled-date' | 'deadline'

// Helper function to get priority name
const getPriorityName = (priority: 1 | 2 | 3 | 4) => {
  switch (priority) {
    case 4: return 'Urgent'
    case 3: return 'High'
    case 2: return 'Medium'
    case 1: return 'Low'
  }
}

// Helper function to get priority background color
const getPriorityBgColor = (priority: 1 | 2 | 3 | 4) => {
  switch (priority) {
    case 4: return 'bg-red-500'
    case 3: return 'bg-orange-500'
    case 2: return 'bg-yellow-500'
    case 1: return 'bg-blue-500'
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('order')
  const [allCollapsed, setAllCollapsed] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Load projects with descriptions
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout

    async function loadProjects() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/projects/with-metadata')
        
        if (response.status === 429) {
          // Handle rate limit error
          const errorData = await response.json()
          setError(errorData.error || 'Rate limit exceeded. Please wait before trying again.')
          
          // Retry after 30 seconds
          retryTimeout = setTimeout(() => {
            loadProjects()
          }, 30000)
          return
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }

        const projectsData = await response.json()
        // Filter out inbox projects
        const filteredProjects = projectsData.filter((project: ProjectWithMetadata) => !project.isInboxProject)
        setProjects(filteredProjects)
      } catch (err) {
        console.error('Error loading projects:', err)
        setError(err instanceof Error ? err.message : 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
    
    // Cleanup function
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [])

  const handleMetadataChange = useCallback(async (projectId: string, metadata: {
    description?: string
    category?: 'area' | 'project' | null
    priority?: 1 | 2 | 3 | 4 | null
    dueString?: string
    deadline?: string
  }) => {
    // Optimistically update local state immediately
    const previousProjects = projects
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            description: metadata.description ?? project.description,
            category: metadata.category !== undefined ? metadata.category : project.category,
            priority: metadata.priority !== undefined ? metadata.priority : project.priority,
            // Handle date parsing for display
            ...(metadata.dueString && { due: { date: '', string: metadata.dueString } }),
            ...(metadata.deadline && { deadline: { date: '', string: metadata.deadline } })
          } as ProjectWithMetadata
        : project
    ))

    try {
      // Update the project metadata via API
      const response = await fetch(`/api/projects/${projectId}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Response error:', errorData)
        
        // Revert on error
        setProjects(previousProjects)
        
        if (response.status === 404) {
          // Project doesn't exist - refresh the project list
          console.error('Project not found, refreshing project list...')
          window.location.reload()
          return
        }
        
        throw new Error(errorData.error || `Failed to update project metadata: ${response.statusText}`)
      }

      // Project metadata updated successfully
    } catch (err) {
      console.error('Error updating project metadata:', err)
      setError(err instanceof Error ? err.message : 'Failed to update project metadata')
      
      // Revert on error
      setProjects(previousProjects)
    }
  }, [projects])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over || active.id === over.id) return

    // Extract priority from the drop zone ID (format: "priority-4" or "priority-none")
    const overIdStr = over.id.toString()
    if (overIdStr.startsWith('priority-')) {
      const newPriority = overIdStr === 'priority-none' 
        ? null 
        : parseInt(overIdStr.replace('priority-', '')) as 1 | 2 | 3 | 4

      // Find the dragged project
      const draggedProject = projects.find(p => p.id === active.id)
      if (draggedProject && draggedProject.priority !== newPriority) {
        // Update the priority
        handleMetadataChange(draggedProject.id, { priority: newPriority })
      }
    }
  }

  // Group projects by hierarchy (handles unlimited nesting depth)
  const organizeProjects = (projects: ProjectWithMetadata[]) => {
    const projectMap = new Map(projects.map(p => [p.id, p]))
    const organizedProjects: Array<ProjectWithMetadata & { nestingDepth: number }> = []
    const processedIds = new Set<string>()
    
    // Calculate nesting depth for a project
    const calculateDepth = (project: ProjectWithMetadata, visited = new Set<string>()): number => {
      if (!project.parentId) return 0
      if (visited.has(project.id)) return 0 // Avoid circular references
      
      const parent = projectMap.get(project.parentId)
      if (!parent) return 0
      
      visited.add(project.id)
      return 1 + calculateDepth(parent, visited)
    }
    
    // Recursive function to add a project and all its descendants
    const addProjectAndChildren = (project: ProjectWithMetadata, depth: number = 0) => {
      if (processedIds.has(project.id)) return
      
      organizedProjects.push({ ...project, nestingDepth: depth })
      processedIds.add(project.id)
      
      // Find and add all direct children, sorted by their order
      const children = projects
        .filter(p => p.parentId === project.id)
        .sort((a, b) => a.order - b.order)
      children.forEach(child => addProjectAndChildren(child, depth + 1))
    }
    
    // Start with root projects (those without parents), sorted by order
    const rootProjects = projects
      .filter(p => !p.parentId)
      .sort((a, b) => a.order - b.order)
    rootProjects.forEach(rootProject => addProjectAndChildren(rootProject, 0))
    
    // Add any orphaned projects (projects whose parents might not exist)
    const remainingProjects = projects.filter(p => !processedIds.has(p.id))
    remainingProjects.forEach(project => {
      const depth = calculateDepth(project)
      addProjectAndChildren(project, depth)
    })
    
    return organizedProjects
  }

  // Filter projects based on active filter
  const filteredProjects = projects.filter(project => {
    switch (activeFilter) {
      case 'without-descriptions':
        return !project.description.trim()
      case 'areas':
        return project.category === 'area'
      case 'projects':
        return project.category === 'project'
      case 'no-type':
        return !project.category
      case 'need-priority':
        return !project.priority
      case 'need-dates':
        return project.category === 'project' && (!project.due || !project.deadline)
      case 'all':
      default:
        return true
    }
  })

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'order') {
      // Sort by Todoist's order
      return a.order - b.order
    } else if (sortBy === 'priority') {
      // Sort by priority (4=P1 highest, 1=P4 lowest, null last)
      const aPriority = a.priority || 0
      const bPriority = b.priority || 0
      if (aPriority === bPriority) {
        return a.name.localeCompare(b.name) // Secondary sort by name
      }
      return bPriority - aPriority // Higher number = higher priority
    } else if (sortBy === 'scheduled-date') {
      // Sort by scheduled date (earliest first, null last)
      const aDate = a.due?.date ? new Date(a.due.date).getTime() : Infinity
      const bDate = b.due?.date ? new Date(b.due.date).getTime() : Infinity
      if (aDate === bDate) {
        return a.name.localeCompare(b.name)
      }
      return aDate - bDate
    } else if (sortBy === 'deadline') {
      // Sort by deadline (earliest first, null last)
      const aDeadline = a.deadline?.date ? new Date(a.deadline.date).getTime() : Infinity
      const bDeadline = b.deadline?.date ? new Date(b.deadline.date).getTime() : Infinity
      if (aDeadline === bDeadline) {
        return a.name.localeCompare(b.name)
      }
      return aDeadline - bDeadline
    } else {
      // Sort by name (default)
      return a.name.localeCompare(b.name)
    }
  })

  // When sorting by order, organize into hierarchy
  // Otherwise, show flat list to see all projects sorted together
  const organizedProjects = sortBy === 'order' 
    ? organizeProjects(sortedProjects)
    : sortedProjects.map(p => ({ ...p, nestingDepth: 0 }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-todoist-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Projects</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-todoist-blue text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
            <Link
              href="/"
              className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
            >
              Task Processor
            </Link>
          </div>
          <p className="text-gray-600">
            Manage your Todoist projects and their descriptions. Descriptions are stored as special tasks 
            within each project for compatibility with other Todoist clients.
          </p>
        </div>

        {/* Project Filters & Sort */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Filter & Sort</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAllCollapsed(!allCollapsed)}
                className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {allCollapsed ? 'Expand All' : 'Collapse All'}
              </button>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="px-3 py-1 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="order">Todoist Order</option>
                  <option value="name">Name</option>
                  <option value="priority">Priority</option>
                  <option value="priority-grouped">Priority (Grouped)</option>
                  <option value="scheduled-date">Scheduled Date</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Actionable Filters */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Actionable Items</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveFilter('without-descriptions')}
                className={`p-4 rounded-lg shadow-sm border transition-all ${
                  activeFilter === 'without-descriptions' 
                    ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl font-bold text-orange-600">
                  {projects.filter(p => !p.description.trim()).length}
                </div>
                <div className="text-sm text-gray-600">Without Descriptions</div>
              </button>
              
              <button
                onClick={() => setActiveFilter('need-priority')}
                className={`p-4 rounded-lg shadow-sm border transition-all ${
                  activeFilter === 'need-priority' 
                    ? 'bg-red-50 border-red-300 ring-2 ring-red-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl font-bold text-red-600">
                  {projects.filter(p => !p.priority).length}
                </div>
                <div className="text-sm text-gray-600">Need Priority</div>
              </button>
              
              <button
                onClick={() => setActiveFilter('need-dates')}
                className={`p-4 rounded-lg shadow-sm border transition-all ${
                  activeFilter === 'need-dates' 
                    ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl font-bold text-yellow-600">
                  {projects.filter(p => p.category === 'project' && (!p.due || !p.deadline)).length}
                </div>
                <div className="text-sm text-gray-600">Need Dates</div>
              </button>
              
              <button
                onClick={() => setActiveFilter('no-type')}
                className={`p-4 rounded-lg shadow-sm border transition-all ${
                  activeFilter === 'no-type' 
                    ? 'bg-gray-50 border-gray-400 ring-2 ring-gray-300' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl font-bold text-gray-600">
                  {projects.filter(p => !p.category).length}
                </div>
                <div className="text-sm text-gray-600">No Type</div>
              </button>
            </div>
          </div>

          {/* Organizational Filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveFilter('all')}
                className={`p-4 rounded-lg shadow-sm border transition-all ${
                  activeFilter === 'all' 
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
                <div className="text-sm text-gray-600">Total Projects</div>
              </button>
              
              <button
                onClick={() => setActiveFilter('areas')}
                className={`p-4 rounded-lg shadow-sm border transition-all ${
                  activeFilter === 'areas' 
                    ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl font-bold text-purple-600">
                  {projects.filter(p => p.category === 'area').length}
                </div>
                <div className="text-sm text-gray-600">Areas of Responsibility</div>
              </button>
              
              <button
                onClick={() => setActiveFilter('projects')}
                className={`p-4 rounded-lg shadow-sm border transition-all ${
                  activeFilter === 'projects' 
                    ? 'bg-green-50 border-green-300 ring-2 ring-green-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.category === 'project').length}
                </div>
                <div className="text-sm text-gray-600">Projects</div>
              </button>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeFilter === 'all' ? 'All Projects' :
             activeFilter === 'without-descriptions' ? 'Projects Without Descriptions' :
             activeFilter === 'areas' ? 'Areas of Responsibility' :
             activeFilter === 'projects' ? 'Projects' :
             activeFilter === 'no-type' ? 'Projects Without Type' :
             activeFilter === 'need-priority' ? 'Projects Needing Priority' :
             activeFilter === 'need-dates' ? 'Projects Needing Dates' : 'Projects'}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({organizedProjects.length} {organizedProjects.length === 1 ? 'project' : 'projects'})
            </span>
          </h2>
        </div>

        {organizedProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600">
              {activeFilter === 'all' ? 'No projects are available at the moment.' :
               activeFilter === 'without-descriptions' ? 'All projects have descriptions.' :
               activeFilter === 'areas' ? 'No areas of responsibility found.' :
               activeFilter === 'projects' ? 'No projects found.' :
               activeFilter === 'no-type' ? 'All projects have been categorized.' :
               activeFilter === 'need-priority' ? 'All projects have priorities assigned.' :
               activeFilter === 'need-dates' ? 'All projects have dates set.' : 'No projects match the current filter.'}
            </p>
          </div>
        ) : sortBy === 'priority-grouped' ? (
          // Priority grouped view with drag and drop
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-8">
              {([4, 3, 2, 1, null] as const).map((priorityLevel) => {
                const projectsInPriority = organizedProjects.filter(p => p.priority === priorityLevel)
                
                return (
                  <div key={priorityLevel ?? 'none'} className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {priorityLevel ? `P${5 - priorityLevel} - ${getPriorityName(priorityLevel)}` : 'No Priority'}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({projectsInPriority.length} {projectsInPriority.length === 1 ? 'project' : 'projects'})
                      </span>
                      {priorityLevel && (
                        <div className={`w-3 h-3 rounded-full ${getPriorityBgColor(priorityLevel)}`} />
                      )}
                    </div>
                    
                    <PriorityDropZone
                      priorityLevel={priorityLevel}
                      projects={projectsInPriority}
                      onMetadataChange={handleMetadataChange}
                      isCollapsed={allCollapsed}
                    />
                  </div>
                )
              })}
            </div>
            
            <DragOverlay>
              {activeId ? (
                <div className="opacity-50">
                  <EnhancedProjectCard
                    project={projects.find(p => p.id === activeId)!}
                    nestingDepth={0}
                    isCollapsed={allCollapsed}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="space-y-4">
            {organizedProjects.map((project) => (
              <EnhancedProjectCard
                key={project.id}
                project={project}
                nestingDepth={project.nestingDepth}
                onMetadataChange={handleMetadataChange}
                isCollapsed={allCollapsed}
              />
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-900 mb-2">How Project Metadata Works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Project metadata is stored as special tasks within each project</li>
            <li>• These tasks use the project name as content and have the &quot;project-metadata&quot; label</li>
            <li>• The description field contains the actual project description</li>
            <li>• Project type (Area/Project) is stored using additional labels</li>
            <li>• Priority, scheduled dates, and deadlines are stored in the task fields</li>
            <li>• All metadata auto-saves after 1 second of inactivity</li>
          </ul>
        </div>
      </div>
    </div>
  )
}