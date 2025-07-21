'use client'

import { TodoistTask, TodoistProject } from '@/lib/types'
import { ProjectSuggestion } from '@/lib/suggestions-cache'

interface ProjectSuggestionsProps {
  task: TodoistTask
  projects: TodoistProject[]
  suggestions: ProjectSuggestion[]
  onProjectSelect: (projectId: string) => void
}

export default function ProjectSuggestions({ 
  task, 
  projects, 
  suggestions,
  onProjectSelect 
}: ProjectSuggestionsProps) {

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return '#299fe6'
    
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
    return colorMap[project.color] || '#299fe6'
  }


  if (!suggestions.length) {
    console.log('ProjectSuggestions: No suggestions available')
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">
          Suggested Projects
        </h3>
        <div className="text-xs text-gray-600">AI-powered suggestions</div>
      </div>
      
      <div className="space-y-2">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <button
            key={`${suggestion.projectId}-${index}`}
            onClick={() => onProjectSelect(suggestion.projectId)}
            className="w-full text-left p-3 rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getProjectColor(suggestion.projectId) }}
                />
                <span className="font-medium text-gray-900 text-sm">
                  {suggestion.projectName}
                </span>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getConfidenceColor(suggestion.confidence)}`}>
                {Math.round(suggestion.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-600 group-hover:text-gray-700">
              {suggestion.reasoning}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}