'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TodoistTask, TodoistProject, TodoistLabel, TaskUpdate, MockAISuggestion } from '@/lib/types'
import ProjectDropdown from './ProjectDropdown'

interface TaskFormProps {
  task: TodoistTask
  projects: TodoistProject[]
  labels: TodoistLabel[]
  suggestions: MockAISuggestion[]
  onAutoSave: (updates: TaskUpdate) => void
  onNext: () => void
}

export default function TaskForm({ task, projects, labels, suggestions, onAutoSave, onNext }: TaskFormProps) {
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
    <div className="space-y-6">
      {/* Task Modification Controls */}
      <div className="space-y-4">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-todoist-blue focus:border-transparent resize-none"
            rows={2}
            placeholder="Add additional details..."
          />
        </div>

        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <ProjectDropdown
            projects={projects}
            selectedProjectId={formData.projectId || ''}
            onProjectChange={handleProjectChange}
            placeholder="Select project..."
            includeInbox={false}
            className="mb-2"
          />
          {projectSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {projectSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 hover:bg-green-100 transition-colors"
                >
                  🤖 Suggest: {suggestion.suggestion} ({Math.round(suggestion.confidence * 100)}%)
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority is now handled via P key + 1-4 overlay */}

        {/* Labels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Labels
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {labels.map((label) => {
              const labelColor = getTodoistColor(label.color)
              const isSelected = selectedLabels.has(label.name)
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.name)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors flex items-center space-x-2 ${
                    isSelected
                      ? 'text-white border-transparent'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                  style={isSelected ? { backgroundColor: labelColor } : {}}
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: labelColor }}
                  ></div>
                  <span>{label.name}</span>
                </button>
              )
            })}
          </div>
          {labelSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {labelSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  🏷️ Suggest: {suggestion.suggestion} ({Math.round(suggestion.confidence * 100)}%)
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Due Date
          </label>
          <input
            type="text"
            value={formData.dueString}
            onChange={(e) => setFormData(prev => ({ ...prev, dueString: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-todoist-blue focus:border-transparent"
            placeholder="e.g., tomorrow, next friday, in 2 weeks..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Use natural language like &quot;tomorrow&quot;, &quot;next Friday&quot;, &quot;in 2 weeks&quot;
          </p>
        </div>
      </div>

      {/* Next Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onNext}
          className="w-full bg-todoist-blue text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-colors font-medium focus:ring-2 focus:ring-todoist-blue focus:ring-offset-2"
        >
          Next Task <span className="kbd ml-2">Enter</span>
        </button>
      </div>
    </div>
  )
}