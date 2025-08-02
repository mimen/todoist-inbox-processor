'use client'

import { useDroppable } from '@dnd-kit/core'
import DraggableProjectCard from './DraggableProjectCard'

interface PriorityDropZoneProps {
  priorityLevel: 1 | 2 | 3 | 4 | null
  projects: any[]
  onMetadataChange: (projectId: string, metadata: any) => void
  isCollapsed: boolean
}

export default function PriorityDropZone({
  priorityLevel,
  projects,
  onMetadataChange,
  isCollapsed
}: PriorityDropZoneProps) {
  const dropZoneId = priorityLevel ? `priority-${priorityLevel}` : 'priority-none'
  const { setNodeRef, isOver } = useDroppable({
    id: dropZoneId,
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] rounded-lg border-2 border-dashed transition-all p-4 ${
        isOver 
          ? 'border-blue-400 bg-blue-50 scale-[1.02]' 
          : projects.length === 0 
            ? 'border-gray-300 bg-gray-50' 
            : 'border-transparent bg-gray-50/50'
      }`}
    >
      {projects.length === 0 && !isOver && (
        <div className="flex items-center justify-center h-[40px] text-gray-400 text-sm">
          Drop projects here
        </div>
      )}
      
      {isOver && projects.length === 0 && (
        <div className="flex items-center justify-center h-[40px] text-blue-600 text-sm font-medium">
          Release to set priority
        </div>
      )}
      
      <div className="space-y-4">
        {projects.map((project) => (
          <DraggableProjectCard
            key={project.id}
            id={project.id}
            project={project}
            nestingDepth={project.nestingDepth}
            onMetadataChange={onMetadataChange}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>
    </div>
  )
}