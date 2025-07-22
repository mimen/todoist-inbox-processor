'use client'

import { useState } from 'react'
import { TodoistProject, TodoistUser } from '@/lib/types'

interface ProjectMetadataDisplayProps {
  project: TodoistProject | undefined
  metadata: any
  allProjects?: TodoistProject[]
  collaborators?: TodoistUser[]
  className?: string
}

// Todoist color mapping - same as used in other components
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

export default function ProjectMetadataDisplay({ 
  project, 
  metadata,
  allProjects = [],
  collaborators = [],
  className = ''
}: ProjectMetadataDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!project) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <p className="text-sm text-gray-500">No project information available</p>
      </div>
    )
  }

  const hasMetadata = metadata && Object.keys(metadata).length > 0
  const hasDescription = metadata?.description && metadata.description.trim().length > 0
  const hasCollaborators = collaborators && collaborators.length > 0

  // Convert API priority (1-4) to UI priority (P4-P1) - same as TaskCard
  const getUIPriority = (apiPriority: number) => {
    return 5 - apiPriority // 4→P1, 3→P2, 2→P3, 1→P4
  }

  const getPriorityColor = (apiPriority?: number) => {
    if (!apiPriority) return 'text-gray-600 bg-gray-50'
    const uiPriority = getUIPriority(apiPriority)
    switch (uiPriority) {
      case 1: return 'text-red-600 bg-red-50'    // P1 = Urgent
      case 2: return 'text-orange-600 bg-orange-50' // P2 = High
      case 3: return 'text-blue-600 bg-blue-50'  // P3 = Medium
      default: return 'text-gray-600 bg-gray-50' // P4 = Normal
    }
  }

  const getPriorityLabel = (apiPriority?: number) => {
    if (!apiPriority) return 'Normal'
    const uiPriority = getUIPriority(apiPriority)
    switch (uiPriority) {
      case 1: return 'Urgent'  // P1
      case 2: return 'High'    // P2
      case 3: return 'Medium'  // P3
      default: return 'Normal' // P4
    }
  }

  // Format due date
  const formatDueDate = (due?: any) => {
    if (!due?.date) return null
    const date = new Date(due.date)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="space-y-2">
        {/* Compact Header with inline badges */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Project name with color */}
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: getTodoistColor(project.color) }}
            />
            <h3 className="font-medium text-gray-900">{project.name}</h3>
          </div>

          {/* Inline Badges */}
          {!hasMetadata ? (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              No metadata
            </span>
          ) : (
            <>
              {/* Priority Badge */}
              <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(metadata?.priority)}`}>
                P{metadata?.priority ? getUIPriority(metadata.priority) : '4'} • {getPriorityLabel(metadata?.priority)}
              </span>

              {/* Project Type Badge */}
              <span className="px-2 py-1 text-xs font-medium rounded bg-purple-50 text-purple-700">
                {metadata?.type || (project.name.startsWith('🏛') || project.name.includes('AoR') ? 'AoR' : 'Project')}
              </span>

              {/* Due Date Badge */}
              {metadata?.due && (
                <span className="inline-flex items-center space-x-1.5 bg-blue-50 px-2 py-1 rounded text-xs">
                  <svg className="w-3 h-3 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-blue-700">{formatDueDate(metadata.due)}</span>
                </span>
              )}

              {/* Parent Project Badge */}
              {project.parentId && (
                <span className="px-2 py-1 text-xs font-medium rounded bg-gray-50 text-gray-700">
                  ↳ {allProjects.find(p => p.id === project.parentId)?.name || 'Unknown'}
                </span>
              )}
              
              {/* Collaborators Badge */}
              {hasCollaborators && (
                <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded bg-purple-50 text-purple-700">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}</span>
                </span>
              )}
            </>
          )}

          {/* Expand/Collapse button if there's a description or collaborators */}
          {(hasDescription || hasCollaborators) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
              title={isExpanded ? "Collapse details" : "Expand details"}
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Expandable Content */}
        {isExpanded && (hasDescription || hasCollaborators) && (
          <div className="mt-2 pt-2 border-t border-gray-100 space-y-3">
            {/* Description */}
            {hasDescription && (
              <div>
                <p className="text-sm text-gray-600 italic">
                  &ldquo;{metadata.description}&rdquo;
                </p>
              </div>
            )}
            
            {/* Collaborators */}
            {hasCollaborators && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Collaborators ({collaborators.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {collaborators.map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1"
                      title={collaborator.email || collaborator.name}
                    >
                      {collaborator.avatarSmall ? (
                        <img
                          src={collaborator.avatarSmall}
                          alt={collaborator.name}
                          className="w-5 h-5 rounded-full object-cover"
                          onError={(e) => {
                            // Instead of hiding, show fallback icon
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center ${collaborator.avatarSmall ? 'hidden' : ''}`}>
                        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-700">
                        {collaborator.name}
                        {collaborator.isCurrentUser && ' (You)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}