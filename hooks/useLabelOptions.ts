import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistLabel, TodoistTask } from '@/lib/types'
import { ModeConfig } from '@/types/queue'
import { COMMON_SORT_OPTIONS } from '@/constants/queue-config'
import { useDropdownOptions } from './useDropdownOptions'

/**
 * Todoist label color mapping (same as used in LabelIcon)
 */
const LABEL_COLOR_MAP: Record<string, string> = {
  // ID mapping
  '30': '#b8256f', // berry_red
  '31': '#db4035', // red
  '32': '#ff9933', // orange
  '33': '#fad000', // yellow
  '34': '#afb83b', // olive_green
  '35': '#7ecc49', // lime_green
  '36': '#299438', // green
  '37': '#6accbc', // mint_green
  '38': '#158fad', // teal
  '39': '#14aaf5', // sky_blue
  '40': '#96c3eb', // light_blue
  '41': '#4073ff', // blue
  '42': '#884dff', // grape
  '43': '#af38eb', // violet
  '44': '#eb96eb', // lavender
  '45': '#e05194', // magenta
  '46': '#ff8d85', // salmon
  '47': '#808080', // charcoal
  '48': '#b8b8b8', // grey
  '49': '#ccac93', // taupe
  // Name mapping
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
  'taupe': '#ccac93',
}

/**
 * Get label color
 */
function getLabelColor(color?: string): string {
  if (!color) return LABEL_COLOR_MAP['47'] // Default to charcoal
  return LABEL_COLOR_MAP[color] || LABEL_COLOR_MAP['47']
}

/**
 * Hook to convert labels to dropdown options
 */
export function useLabelOptions(
  labels: TodoistLabel[],
  tasks: TodoistTask[],
  config?: ModeConfig
): DropdownOption[] {
  const { calculateCount, sortOptions, filterEmpty } = useDropdownOptions({
    tasks,
    sortBy: config?.sortBy,
    sortOptions: {
      ...COMMON_SORT_OPTIONS,
      count: {
        key: 'count',
        label: 'Sort by Task Count',
        sortFn: (a, b) => (b.count || 0) - (a.count || 0)
      },
      name: {
        key: 'name',
        label: 'Sort by Name',
        sortFn: (a, b) => a.label.localeCompare(b.label)
      }
    }
  })

  return useMemo(() => {
    // Filter out excluded labels
    const filteredLabels = config?.excludeItems 
      ? labels.filter(label => !config.excludeItems?.includes(label.name))
      : labels

    // Convert to options with counts
    const labelOptions = filteredLabels.map(label => ({
      id: label.id,
      label: label.name,
      type: 'label' as const,
      iconColor: getLabelColor(label.color),
      count: calculateCount(task => task.labels.includes(label.name)),
      metadata: { label }
    }))

    // Apply sorting (default is by count)
    const sorted = sortOptions(labelOptions)

    // Filter empty if configured
    return filterEmpty(sorted, config?.hideEmpty || false)
  }, [labels, tasks, config, calculateCount, sortOptions, filterEmpty])
}