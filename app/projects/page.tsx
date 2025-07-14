'use client'

import { useState, useEffect, useCallback } from 'react'
import { TodoistProject } from '@/lib/types'
import ProjectCard from '@/components/ProjectCard'

interface ProjectWithDescription extends TodoistProject {
  description: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithDescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load projects with descriptions
  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/projects/with-descriptions')
        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }

        const projectsData = await response.json()
        setProjects(projectsData)
      } catch (err) {
        console.error('Error loading projects:', err)
        setError(err instanceof Error ? err.message : 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  const handleDescriptionChange = useCallback(async (projectId: string, newDescription: string) => {
    try {
      console.log('Updating project description:', { projectId, newDescription })
      
      // Update the project description via API
      const response = await fetch(`/api/projects/${projectId}/description`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: newDescription }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Response error:', errorData)
        throw new Error(`Failed to update project description: ${errorData.error || response.statusText}`)
      }

      // Update local state
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, description: newDescription }
          : project
      ))

      console.log('Project description updated successfully')
    } catch (err) {
      console.error('Error updating project description:', err)
      setError(err instanceof Error ? err.message : 'Failed to update project description')
    }
  }, [])

  // Group projects by hierarchy (handles unlimited nesting depth)
  const organizeProjects = (projects: ProjectWithDescription[]) => {
    const projectMap = new Map(projects.map(p => [p.id, p]))
    const organizedProjects: Array<ProjectWithDescription & { nestingDepth: number }> = []
    const processedIds = new Set<string>()
    
    // Calculate nesting depth for a project
    const calculateDepth = (project: ProjectWithDescription, visited = new Set<string>()): number => {
      if (!project.parentId) return 0
      if (visited.has(project.id)) return 0 // Avoid circular references
      
      const parent = projectMap.get(project.parentId)
      if (!parent) return 0
      
      visited.add(project.id)
      return 1 + calculateDepth(parent, visited)
    }
    
    // Recursive function to add a project and all its descendants
    const addProjectAndChildren = (project: ProjectWithDescription, depth: number = 0) => {
      if (processedIds.has(project.id)) return
      
      organizedProjects.push({ ...project, nestingDepth: depth })
      processedIds.add(project.id)
      
      // Find and add all direct children
      const children = projects.filter(p => p.parentId === project.id)
      children.forEach(child => addProjectAndChildren(child, depth + 1))
    }
    
    // Start with root projects (those without parents)
    const rootProjects = projects.filter(p => !p.parentId)
    rootProjects.forEach(rootProject => addProjectAndChildren(rootProject, 0))
    
    // Add any orphaned projects (projects whose parents might not exist)
    const remainingProjects = projects.filter(p => !processedIds.has(p.id))
    remainingProjects.forEach(project => {
      const depth = calculateDepth(project)
      addProjectAndChildren(project, depth)
    })
    
    return organizedProjects
  }

  const organizedProjects = organizeProjects(projects)

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Management</h1>
          <p className="text-gray-600">
            Manage your Todoist projects and their descriptions. Descriptions are stored as special tasks 
            within each project for compatibility with other Todoist clients.
          </p>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-todoist-blue">{projects.length}</div>
            <div className="text-sm text-gray-600">Total Projects</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">
              {projects.filter(p => p.description.trim()).length}
            </div>
            <div className="text-sm text-gray-600">With Descriptions</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">
              {projects.filter(p => p.parentId).length}
            </div>
            <div className="text-sm text-gray-600">Nested Projects</div>
          </div>
        </div>

        {/* Projects List */}
        {organizedProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600">No projects are available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {organizedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                nestingDepth={project.nestingDepth}
                onDescriptionChange={handleDescriptionChange}
              />
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-900 mb-2">How Project Descriptions Work</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Project descriptions are stored as special tasks within each project</li>
            <li>• These tasks start with "*" and have the "project description" label</li>
            <li>• They appear at the top of the project due to highest priority (P1)</li>
            <li>• This approach ensures compatibility with all Todoist clients and LLM integrations</li>
            <li>• Descriptions auto-save after 1 second of inactivity</li>
          </ul>
        </div>
      </div>
    </div>
  )
}