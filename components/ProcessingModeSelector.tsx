'use client';

import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ProcessingMode, ProcessingModeType, PROCESSING_MODE_OPTIONS } from '@/types/processing-mode';
import ProjectDropdown from './ProjectDropdown';
import PriorityDropdown from './PriorityDropdown';
import LabelDropdown from './LabelDropdown';
import DateDropdown from './DateDropdown';
import PresetDropdown from './PresetDropdown';
import AllTasksDropdown from './AllTasksDropdown';
import { AssigneeFilterType } from './AssigneeFilter';
import { TodoistTask, TodoistLabel, TodoistProject } from '@/lib/types';

interface ProcessingModeSelectorProps {
  mode: ProcessingMode;
  onModeChange: (mode: ProcessingMode) => void;
  projects: TodoistProject[];
  allTasks: TodoistTask[];
  allTasksGlobal?: TodoistTask[]; // Add this for preset filters
  taskCounts: Record<string, number>;
  labels?: TodoistLabel[];
  projectMetadata?: Record<string, any>;
  currentUserId?: string;
  assigneeFilter?: AssigneeFilterType;
}

export default function ProcessingModeSelector({
  mode,
  onModeChange,
  projects,
  allTasks,
  allTasksGlobal = [],
  taskCounts,
  labels = [],
  projectMetadata = {},
  currentUserId,
  assigneeFilter = 'all'
}: ProcessingModeSelectorProps) {
  const handleModeTypeChange = (newType: ProcessingModeType) => {
    // Reset value when changing mode type
    let defaultValue: string | string[] = '';
    let defaultDisplayName = '';

    // Always default to inbox for project mode
    const inboxProject = projects.find(p => p.isInboxProject);
    const inboxId = inboxProject?.id || '2339440032';
    
    switch (newType) {
      case 'project':
        defaultValue = inboxId;
        defaultDisplayName = inboxProject?.name || 'Inbox';
        break;
      case 'priority':
        defaultValue = '4';
        defaultDisplayName = 'Priority 1';
        break;
      case 'label':
        defaultValue = [];
        defaultDisplayName = 'Select labels...';
        break;
      case 'date':
        defaultValue = 'today';
        defaultDisplayName = 'Today';
        break;
      case 'preset':
        defaultValue = 'daily-planning';
        defaultDisplayName = 'Daily Planning';
        break;
      case 'all':
        defaultValue = 'oldest';
        defaultDisplayName = 'Oldest First';
        break;
    }

    onModeChange({
      type: newType,
      value: defaultValue,
      displayName: defaultDisplayName
    });
  };

  const handleValueChange = (value: string | string[], displayName: string) => {
    onModeChange({
      ...mode,
      value,
      displayName
    });
  };

  // Extract unique labels from all tasks and match with label objects
  const allLabelNames = Array.from(
    new Set(allTasks.flatMap(task => task.labels))
  ).sort();
  
  // Filter tasks based on assignee filter for accurate counts
  const filteredTasks = allTasks.filter(task => {
    if (assigneeFilter === 'all') return true;
    
    switch (assigneeFilter) {
      case 'unassigned':
        return !task.assigneeId;
      case 'assigned-to-me':
        return task.assigneeId === currentUserId;
      case 'assigned-to-others':
        return task.assigneeId && task.assigneeId !== currentUserId;
      case 'not-assigned-to-others':
        return !task.assigneeId || task.assigneeId === currentUserId;
      default:
        return true;
    }
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Processing Options</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-6">
          <RadioGroup
          value={mode.type}
          onValueChange={(value) => handleModeTypeChange(value as ProcessingModeType)}
          className="flex flex-row gap-6"
        >
          {PROCESSING_MODE_OPTIONS.map((option) => (
            <div key={option.type} className="flex items-center space-x-2">
              <RadioGroupItem value={option.type} id={option.type} />
              <Label 
                htmlFor={option.type} 
                className="cursor-pointer font-normal flex items-center gap-1"
              >
                <span>{option.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex items-center gap-4">        
        <div className="flex-1">
          {mode.type === 'project' && (
            <ProjectDropdown
              projects={projects}
              selectedProjectId={mode.value as string}
              onProjectChange={(projectId) => {
                const project = projects.find(p => p.id === projectId);
                handleValueChange(projectId, project?.name || 'Unknown');
              }}
              allTasks={filteredTasks}
            />
          )}

          {mode.type === 'priority' && (
            <PriorityDropdown
              selectedPriority={mode.value as string}
              onPriorityChange={(priority, displayName) => {
                handleValueChange(priority, displayName);
              }}
              allTasks={filteredTasks}
            />
          )}

          {mode.type === 'label' && (
            <LabelDropdown
              selectedLabels={mode.value as string[]}
              onLabelsChange={(labels, displayName) => {
                handleValueChange(labels, displayName);
              }}
              availableLabels={allLabelNames}
              allTasks={filteredTasks}
              labelObjects={labels}
            />
          )}

          {mode.type === 'date' && (
            <DateDropdown
              selectedDate={mode.value as string}
              onDateChange={(date, displayName) => {
                handleValueChange(date, displayName);
              }}
              allTasks={filteredTasks}
            />
          )}

          {mode.type === 'preset' && (
            <PresetDropdown
              selectedPreset={mode.value as string}
              onPresetChange={(presetId, displayName) => {
                handleValueChange(presetId, displayName);
              }}
              allTasks={allTasksGlobal.length > 0 ? allTasksGlobal.filter(task => {
                if (assigneeFilter === 'all') return true;
                
                switch (assigneeFilter) {
                  case 'unassigned':
                    return !task.assigneeId;
                  case 'assigned-to-me':
                    return task.assigneeId === currentUserId;
                  case 'assigned-to-others':
                    return task.assigneeId && task.assigneeId !== currentUserId;
                  case 'not-assigned-to-others':
                    return !task.assigneeId || task.assigneeId === currentUserId;
                  default:
                    return true;
                }
              }) : filteredTasks}
              projectMetadata={projectMetadata}
            />
          )}

          {mode.type === 'all' && (
            <AllTasksDropdown
              selectedSort={mode.value as string}
              onSortChange={(sortBy, displayName) => {
                handleValueChange(sortBy, displayName);
              }}
              allTasks={allTasksGlobal.length > 0 ? allTasksGlobal : allTasks}
            />
          )}
        </div>
        
      </div>
      </div>
    </div>
  );
}