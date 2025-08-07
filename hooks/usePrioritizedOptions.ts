import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistTask, TodoistProject } from '@/lib/types'
import { PrioritizedQueueItem } from '@/types/queue'
import { useProjectOptions } from './useProjectOptions'
import { usePriorityOptions } from './usePriorityOptions'
import { usePresetOptions } from './usePresetOptions'

/**
 * Hook to generate dropdown options based on prioritized queue configuration
 * Combines different option types (project, priority, preset, priority-projects) 
 * in a specific order defined by the configuration
 */
export function usePrioritizedOptions(
  tasks: TodoistTask[],
  prioritizedConfig: PrioritizedQueueItem[],
  projectMetadata: Record<string, any>,
  projects: TodoistProject[]
): DropdownOption[] {
  // Get all available options from existing hooks
  const projectOptions = useProjectOptions(projects, tasks, {})
  const priorityOptions = usePriorityOptions(tasks, {})
  const presetOptions = usePresetOptions(tasks, projectMetadata)


  return useMemo(() => {
    const options: DropdownOption[] = []

    // Process each item in the prioritized configuration IN ORDER
    prioritizedConfig.forEach(item => {
      switch (item.type) {
        case 'project': {
          // Find project by name (case-insensitive)
          let option
          const projectNameLower = item.value.toLowerCase()
          
          if (projectNameLower === 'inbox') {
            // Special handling for inbox - look for the special 'inbox' ID
            option = projectOptions.find(opt => opt.id === 'inbox')
          } else {
            // Find project by name
            const project = projects.find(p => p.name.toLowerCase() === projectNameLower)
            if (project) {
              option = projectOptions.find(opt => opt.id === project.id)
            }
          }
          
          if (option) {
            const finalOption = {
              ...option,
              label: item.name || option.label,
              icon: item.icon || option.icon
            }
            options.push(finalOption)
          }
          break
        }

        case 'priority': {
          // Find specific priority option
          const option = priorityOptions.find(opt => opt.id === item.value)
          if (option) {
            options.push({
              ...option,
              label: item.name || option.label,
              icon: item.icon || option.icon
            })
          }
          break
        }

        case 'preset': {
          // Find specific preset option
          const option = presetOptions.find(opt => opt.id === item.value)
          if (option) {
            options.push({
              ...option,
              label: item.name || option.label,
              icon: item.icon || option.icon
            })
          }
          break
        }

        case 'priority-projects': {
          // Expand all projects with the specified priority
          const targetPriority = parseInt(item.value) // e.g., "3" for P2
          const priorityProjects = projectOptions.filter(project => {
            const metadata = projectMetadata[project.id]
            return metadata?.priority === targetPriority
          })

          // Add all matching projects in their natural order
          priorityProjects.forEach(project => {
            options.push({
              ...project,
              // Keep original label without priority suffix
              metadata: {
                ...project.metadata,
                isPriorityProject: true,
                originalPriority: targetPriority
              }
            })
          })
          break
        }
      }
    })


    return options
  }, [prioritizedConfig, projectOptions, priorityOptions, presetOptions, projectMetadata, projects])
}