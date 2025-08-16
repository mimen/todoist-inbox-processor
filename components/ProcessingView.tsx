'use client'

import React from 'react'
import { TodoistTask, TodoistProject, TodoistLabel, TaskUpdate } from '@/lib/types'
import { ProcessingMode } from '@/types/processing-mode'
import { QueueProgressionState } from '@/types/queue'
import { generateMockSuggestions } from '@/lib/mock-data'
import TaskForm from './TaskForm'
import TaskCard from './TaskCard'
import ProjectMetadataDisplay from './ProjectMetadataDisplay'
import ProjectSuggestions from './ProjectSuggestions'
import QueueProgressBar from './QueueProgressBar'
import QueuePreview from './QueuePreview'
import QueueCompletionView from './QueueCompletionView'
import { ProjectSuggestion } from '@/lib/suggestions-cache'

interface ProcessingViewProps {
  // Queue state
  currentTask: TodoistTask | null
  queuedTasks: TodoistTask[]
  totalTasks: number
  completedTasks: number
  taskKey: number
  
  // Data
  projects: TodoistProject[]
  labels: TodoistLabel[]
  projectHierarchy: TodoistProject[] | null
  projectMetadata: Record<string, any>
  suggestions: ProjectSuggestion[]
  
  // Processing state
  processingMode: ProcessingMode
  queueState: QueueProgressionState | null
  
  // Actions
  onTaskUpdate: (taskId: string, updates: Partial<TodoistTask>) => void
  onProcessTask: () => void
  onSkipTask: () => void
  onOpenOverlay: (type: string) => void
  onProgressToNextQueue: () => void
  onRefresh: () => void
  
  // Settings
  hasCollaborators: boolean
}

export default function ProcessingView({
  currentTask,
  queuedTasks,
  totalTasks,
  completedTasks,
  taskKey,
  projects,
  labels,
  projectHierarchy,
  projectMetadata,
  suggestions,
  processingMode,
  queueState,
  onTaskUpdate,
  onProcessTask,
  onSkipTask,
  onOpenOverlay,
  onProgressToNextQueue,
  onRefresh,
  hasCollaborators
}: ProcessingViewProps) {
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  
  // Empty state or queue completed
  if (!currentTask && queuedTasks.length === 0) {
    const displayName = processingMode.displayName || 'Tasks'
    const isEmptyQueue = totalTasks === 0
    
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">
            {isEmptyQueue ? '📭' : '🎉'}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEmptyQueue ? `${displayName} is Empty` : `${displayName} Complete!`}
          </h1>
          <p className="text-gray-600 mb-4">
            {isEmptyQueue 
              ? `No tasks found for ${displayName}. Try selecting different criteria.`
              : 'All tasks have been processed.'
            }
          </p>
          {!isEmptyQueue && (
            <div className="text-sm text-gray-500 mb-6">
              Processed: {completedTasks} tasks
            </div>
          )}
          
          {/* Queue Completion/Empty State */}
          <QueueCompletionView
            isEmptyQueue={isEmptyQueue}
            hasNextQueue={queueState?.hasNextQueue || false}
            nextQueueLabel={queueState?.nextQueue?.label}
            nextQueueCount={queueState?.nextQueue?.count}
            queueProgress={queueState?.queueProgress}
            onContinue={onProgressToNextQueue}
            onRefresh={onRefresh}
          />
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col">
      {/* Queue Progress */}
      <div className="mb-6">
        <QueueProgressBar
          completed={completedTasks}
          total={totalTasks}
          percentage={progress}
          queueName={processingMode.displayName || 'Tasks'}
        />
      </div>
      
      {/* Task Card and Form */}
      {currentTask && (
        <>
          {/* Show if all tasks are processed */}
          {totalTasks > 0 && completedTasks === totalTasks && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center mb-6">
              <svg className="w-12 h-12 text-green-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-bold text-green-800 mb-2">All Tasks Processed! 🎉</h3>
              <p className="text-green-700">
                Great job! You&apos;ve processed all {totalTasks} tasks in this queue.
                {!queueState?.hasNextQueue && ' This was the last queue in the sequence.'}
              </p>
            </div>
          )}
          
          {/* Task Card */}
          <TaskCard 
            task={currentTask} 
            projects={projects} 
            labels={labels} 
            assignee={undefined}
            hasCollaborators={hasCollaborators}
            dateLoadingState={null}
            onContentChange={(newContent) => onTaskUpdate(currentTask.id, { content: newContent })}
            onDescriptionChange={(newDescription) => onTaskUpdate(currentTask.id, { description: newDescription })}
            onProjectClick={() => onOpenOverlay('project')}
            onPriorityClick={() => onOpenOverlay('priority')}
            onLabelAdd={() => onOpenOverlay('label')}
            onLabelRemove={(label) => onTaskUpdate(currentTask.id, { labels: currentTask.labels.filter(l => l !== label) })}
            onScheduledClick={() => onOpenOverlay('scheduled')}
            onDeadlineClick={() => onOpenOverlay('deadline')}
            onAssigneeClick={() => onOpenOverlay('assignee')}
          />

          {/* Project Metadata Display */}
          <div className="mt-4">
            <ProjectMetadataDisplay
              project={projects.find(p => p.id === currentTask?.projectId)}
              metadata={projectMetadata[currentTask?.projectId || '']}
              allProjects={projects}
              collaborators={[]}
              className="animate-fade-in"
            />
          </div>

          {/* Project Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-4">
              <ProjectSuggestions
                task={currentTask}
                projects={projects}
                suggestions={suggestions}
                onProjectSelect={(projectId) => onTaskUpdate(currentTask.id, { projectId })}
              />
            </div>
          )}

          {/* Task Form Controls */}
          <div className="mt-4">
            <TaskForm
              key={taskKey}
              task={currentTask}
              projects={projects}
              labels={labels}
              suggestions={generateMockSuggestions(currentTask.content)}
              onAutoSave={(updates: TaskUpdate) => {
                // Convert TaskUpdate to Partial<TodoistTask>
                const todoistUpdates: Partial<TodoistTask> = {
                  content: updates.content,
                  description: updates.description,
                  projectId: updates.projectId,
                  priority: updates.priority,
                  labels: updates.labels,
                  // Convert duration from number to object format if present
                  ...(updates.duration !== undefined && {
                    duration: {
                      amount: updates.duration,
                      unit: updates.durationUnit || 'minute'
                    }
                  })
                }
                
                // Handle due date updates
                if (updates.dueDate || updates.dueDatetime || updates.dueString) {
                  todoistUpdates.due = {
                    date: updates.dueDate || '',
                    datetime: updates.dueDatetime,
                    string: updates.dueString || '',
                    recurring: false
                  }
                }
                
                onTaskUpdate(currentTask.id, todoistUpdates)
              }}
              onNext={onProcessTask}
              onPrevious={() => {}}
              canGoNext={true}
              canGoPrevious={false}
            />
          </div>
        </>
      )}
      
      {/* Queue Preview */}
      {queuedTasks.length > 0 && (
        <div className="mt-8">
          <div className="max-w-2xl mx-auto p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2 text-center">
              Next in Queue ({queuedTasks.length})
            </h3>
            <QueuePreview tasks={queuedTasks} />
          </div>
        </div>
      )}
    </div>
  )
}
