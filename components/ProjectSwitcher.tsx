'use client'

import { TodoistProject } from '@/lib/types'
import { ProjectDropdown } from './dropdowns'

interface ProjectSwitcherProps {
  projects: TodoistProject[]
  selectedProjectId: string
  onProjectChange: (projectId: string) => void
  taskCount?: number
  allTasks?: any[]
}

export default function ProjectSwitcher({ 
  projects, 
  selectedProjectId, 
  onProjectChange,
  taskCount = 0,
  allTasks = []
}: ProjectSwitcherProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Processing Project</h3>
        <span className="text-xs text-gray-500">
          {taskCount} tasks
        </span>
      </div>
      
      <ProjectDropdown
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={onProjectChange}
        placeholder="Select project to process..."
        includeInbox={true}
        allTasks={allTasks}
      />

      <div className="mt-3 text-xs text-gray-500">
        💡 Select a project to process its tasks. Use keyboard shortcuts: S to skip, Enter to process.
      </div>
    </div>
  )
}