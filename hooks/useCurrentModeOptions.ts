import { useMemo } from 'react'
import { ProcessingModeType } from '@/types/processing-mode'
import { DropdownOption } from '@/types/dropdown'
import { TodoistTask, TodoistProject, TodoistLabel } from '@/lib/types'
import { useProjectOptions } from './useProjectOptions'
import { usePriorityOptions } from './usePriorityOptions'
import { useLabelOptions } from './useLabelOptions'
import { useDateOptions } from './useDateOptions'
import { useDeadlineOptions } from './useDeadlineOptions'
import { usePresetOptions } from './usePresetOptions'
import { useAllOptions } from './useAllOptions'
import { useQueueConfig } from './useQueueConfig'

interface UseCurrentModeOptionsProps {
  mode: ProcessingModeType
  projects: TodoistProject[]
  allTasks: TodoistTask[]
  labels: TodoistLabel[]
  projectMetadata: Record<string, any>
}

export function useCurrentModeOptions({
  mode,
  projects,
  allTasks,
  labels,
  projectMetadata
}: UseCurrentModeOptionsProps): DropdownOption[] {
  const queueConfig = useQueueConfig()

  const projectOptions = useProjectOptions(
    projects,
    allTasks,
    queueConfig.standardModes.project
  )

  const priorityOptions = usePriorityOptions(
    allTasks,
    queueConfig.standardModes.priority
  )

  const labelOptions = useLabelOptions(
    labels,
    allTasks,
    queueConfig.standardModes.label
  )

  const dateOptions = useDateOptions(
    allTasks,
    queueConfig.standardModes.date
  )

  const deadlineOptions = useDeadlineOptions(
    allTasks,
    queueConfig.standardModes.deadline
  )

  const presetOptions = usePresetOptions(
    allTasks,
    projectMetadata,
    queueConfig.standardModes.preset
  )

  const allOptions = useAllOptions(
    allTasks,
    queueConfig.standardModes.all
  )

  return useMemo(() => {
    switch (mode) {
      case 'project':
        return projectOptions
      case 'priority':
        return priorityOptions
      case 'label':
        return labelOptions
      case 'date':
        return dateOptions
      case 'deadline':
        return deadlineOptions
      case 'preset':
        return presetOptions
      case 'all':
        return allOptions
      default:
        return []
    }
  }, [mode, projectOptions, priorityOptions, labelOptions, dateOptions, deadlineOptions, presetOptions, allOptions])
}