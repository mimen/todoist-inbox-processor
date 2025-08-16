'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import EnhancedProjectCard from './EnhancedProjectCard'

interface DraggableProjectCardProps {
  id: string
  project: any
  nestingDepth?: number
  onMetadataChange?: (projectId: string, metadata: any) => void
  isCollapsed?: boolean
}

export default function DraggableProjectCard({
  id,
  project,
  nestingDepth = 0,
  onMetadataChange,
  isCollapsed = false
}: DraggableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <EnhancedProjectCard
        project={project}
        nestingDepth={nestingDepth}
        onMetadataChange={onMetadataChange}
        isCollapsed={isCollapsed}
      />
    </div>
  )
}