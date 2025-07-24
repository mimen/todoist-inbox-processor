import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistProject, TodoistTask } from '@/lib/types'
import { ModeConfig } from '@/types/queue'
import { COMMON_SORT_OPTIONS } from '@/constants/queue-config'
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
  const { calculateCount, sortOptions, filterEmpty } = useDropdownOptions({
    tasks,
    sortBy: config?.sortBy,
    sortOptions: {
      ...COMMON_SORT_OPTIONS,
      default: {
        key: 'default',
        label: 'Default Order',
        sortFn: () => 0 // Maintain original order
      }
    }
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

    // Handle hierarchy vs flat list
    if (config?.sortBy === 'default' || !config?.sortBy) {
      // Build hierarchy with parent-child relationships
      const rootProjects = regularProjects.filter(p => !p.parentId)
      const childProjectsMap = new Map<string, TodoistProject[]>()
      
      // Group children by parent
      regularProjects.forEach(project => {
        if (project.parentId) {
          const siblings = childProjectsMap.get(project.parentId) || []
          siblings.push(project)
          childProjectsMap.set(project.parentId, siblings)
        }
      })

      // Recursive function to add project and its children
      const addProjectWithChildren = (project: TodoistProject, indent = 0) => {
        const option = projectToOption(project, indent)
        options.push(option)

        // Add children
        const children = childProjectsMap.get(project.id) || []
        children.forEach(child => {
          const childOption = projectToOption(child, indent + 1)
          // Add children to parent's children array for hierarchical display
          if (!option.children) option.children = []
          option.children.push(childOption)
          
          // Also add to flat list for navigation
          addProjectWithChildren(child, indent + 1)
        })
      }

      // Add all root projects and their children
      rootProjects.forEach(project => addProjectWithChildren(project))
    } else {
      // Flatten all projects for sorting
      const allOptions = regularProjects.map(project => projectToOption(project))
      options.push(...sortOptions(allOptions))
    }

    // Filter empty if configured
    return filterEmpty(options, config?.hideEmpty || false)
  }, [projects, tasks, config, calculateCount, sortOptions, filterEmpty])
}