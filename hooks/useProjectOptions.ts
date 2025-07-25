import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistProject, TodoistTask } from '@/lib/types'
import { ModeConfig } from '@/types/queue'
import { useDropdownOptions } from './useDropdownOptions'

/**
 * Todoist color name to hex color mapping
 */
const TODOIST_COLOR_MAP: Record<string, string> = {
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

/**
 * Convert Todoist color name to hex color
 */
function getTodoistColor(colorName: string): string {
  return TODOIST_COLOR_MAP[colorName] || '#808080'
}

/**
 * Hook to convert projects to dropdown options
 */
export function useProjectOptions(
  projects: TodoistProject[],
  tasks: TodoistTask[],
  config?: ModeConfig
): DropdownOption[] {
  const { calculateCount, filterEmpty } = useDropdownOptions({
    tasks
  })

  return useMemo(() => {
    // Separate inbox and regular projects
    const inboxProject = projects.find(p => p.isInboxProject)
    const regularProjects = projects.filter(p => !p.isInboxProject)

    // Helper to convert project to option
    const projectToOption = (project: TodoistProject, indent = 0): DropdownOption => ({
      id: project.id,
      label: project.name,
      type: 'project',
      iconColor: getTodoistColor(project.color),
      count: calculateCount(task => task.projectId === project.id),
      metadata: {
        project,
        parentId: project.parentId,
        indent,
        isInboxProject: project.isInboxProject
      }
    })

    let options: DropdownOption[] = []

    // Add inbox first if it exists
    if (inboxProject) {
      options.push({
        ...projectToOption(inboxProject),
        id: 'inbox', // Special ID for inbox
        label: 'Inbox'
      })
    }

    // Always build hierarchy - UnifiedDropdown will handle display
    // Build hierarchy with parent-child relationships
    const rootProjects = regularProjects.filter(p => !p.parentId)
    
    // Sort root projects by order
    const sortedRootProjects = rootProjects.sort((a, b) => a.order - b.order)

    // Recursive function to add project and its children
    const addProjectWithChildren = (project: TodoistProject, indent = 0) => {
      const option = projectToOption(project, indent)
      options.push(option)

      // Find all children of this project
      const children = regularProjects.filter(p => p.parentId === project.id)
      
      // Sort children by order if they exist
      const sortedChildren = children.sort((a, b) => a.order - b.order)
      
      // Recursively add each child
      sortedChildren.forEach(child => {
        addProjectWithChildren(child, indent + 1)
      })
    }

    // Add all root projects and their children
    sortedRootProjects.forEach(project => addProjectWithChildren(project))

    // Filter empty if configured
    return filterEmpty(options, config?.hideEmpty || false)
  }, [projects, tasks, config, calculateCount, filterEmpty])
}