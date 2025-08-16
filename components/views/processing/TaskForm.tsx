'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TodoistTask, TodoistProject, TodoistLabel, TaskUpdate, MockAISuggestion } from '@/lib/types'
import { ProjectDropdown } from '../../dropdowns'

interface TaskFormProps {
  task: TodoistTask
  projects: TodoistProject[]
  labels: TodoistLabel[]
  suggestions: MockAISuggestion[]
  onAutoSave: (updates: TaskUpdate) => void
  onNext: () => void
  onPrevious: () => void
  canGoNext: boolean
  canGoPrevious: boolean
}

export default function TaskForm({ task, projects, labels, suggestions, onAutoSave, onNext, onPrevious, canGoNext, canGoPrevious }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskUpdate>({
    content: task.content,
    description: task.description || '',
    projectId: task.projectId,
    labels: [...task.labels],
    dueString: '',
  })

  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set(task.labels))
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<TaskUpdate | null>(null)

  // Auto-save with debounce
  const debouncedSave = useCallback((updates: TaskUpdate) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      // Only save if data has actually changed
      const dataToSave = { ...updates, labels: Array.from(selectedLabels) }
      const currentDataString = JSON.stringify(dataToSave)
      const lastSavedString = JSON.stringify(lastSavedDataRef.current)
      
      if (currentDataString !== lastSavedString) {
        console.log('Auto-saving changes:', dataToSave)
        onAutoSave(dataToSave)
        lastSavedDataRef.current = dataToSave
      }
    }, 2000)
  }, [onAutoSave, selectedLabels])

  // Reset form data when task changes
  useEffect(() => {
    const newFormData = {
      content: task.content,
      description: task.description || '',
      projectId: task.projectId,
      labels: [...task.labels],
      dueString: '',
    }
    setFormData(newFormData)
    setSelectedLabels(new Set(task.labels))
    lastSavedDataRef.current = { ...newFormData, labels: task.labels }
    
    // Clear any pending saves when task changes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  }, [task.id, task.content, task.description, task.projectId, task.labels])

  // Trigger auto-save when form data changes
  useEffect(() => {
    debouncedSave(formData)
  }, [formData, debouncedSave])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // No longer need handleSubmit since we auto-save

  const handleProjectChange = (projectId: string) => {
    setFormData(prev => ({ ...prev, projectId }))
  }

  // Priority is now handled by the overlay, no longer needed here

  const toggleLabel = (labelName: string) => {
    const newLabels = new Set(selectedLabels)
    if (newLabels.has(labelName)) {
      newLabels.delete(labelName)
    } else {
      newLabels.add(labelName)
    }
    setSelectedLabels(newLabels)
    // Trigger auto-save for label changes
    debouncedSave({ ...formData, labels: Array.from(newLabels) })
  }

  const applySuggestion = (suggestion: MockAISuggestion) => {
    switch (suggestion.type) {
      case 'project':
        const project = projects.find(p => p.name === suggestion.suggestion)
        if (project) {
          handleProjectChange(project.id)
        }
        break
      case 'label':
        toggleLabel(suggestion.suggestion)
        break
      case 'rewrite':
        setFormData(prev => ({ ...prev, content: suggestion.suggestion }))
        break
      case 'priority':
        // Priority is now handled by the overlay, suggestions disabled
        break
    }
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

  const projectSuggestions = suggestions.filter(s => s.type === 'project')
  const labelSuggestions = suggestions.filter(s => s.type === 'label')
  const rewriteSuggestions = suggestions.filter(s => s.type === 'rewrite')
  // prioritySuggestions removed - priority is now handled by overlay

  return (
    <div>
      {/* Navigation Buttons Only */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors focus:ring-2 focus:ring-offset-2 ${
            canGoPrevious
              ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
              : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
          }`}
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors focus:ring-2 focus:ring-offset-2 ${
            canGoNext
              ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
              : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
          }`}
        >
          Next Task →
        </button>
      </div>
    </div>
  )
}