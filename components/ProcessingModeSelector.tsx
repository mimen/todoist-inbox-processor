'use client';

import React, { useState, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ProcessingMode, ProcessingModeType, PROCESSING_MODE_OPTIONS } from '@/types/processing-mode';
import ProjectDropdown from './ProjectDropdown';
import PriorityDropdown from './PriorityDropdown';
import LabelDropdown from './LabelDropdown';
import DateDropdown from './DateDropdown';
import DeadlineDropdown from './DeadlineDropdown';
import PresetDropdown from './PresetDropdown';
import AllTasksDropdown from './AllTasksDropdown';
import { AssigneeFilterType } from './AssigneeFilter';
import { TodoistTask, TodoistLabel, TodoistProject } from '@/lib/types';

export interface ProcessingModeSelectorRef {
  switchToMode: (type: ProcessingModeType) => void;
  openCurrentDropdown: () => void;
}

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

const ProcessingModeSelector = forwardRef<ProcessingModeSelectorRef, ProcessingModeSelectorProps>(({
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
}: ProcessingModeSelectorProps, ref) => {
  // Refs for each dropdown
  const projectDropdownRef = useRef<any>(null);
  const priorityDropdownRef = useRef<any>(null);
  const labelDropdownRef = useRef<any>(null);
  const dateDropdownRef = useRef<any>(null);
  const deadlineDropdownRef = useRef<any>(null);
  const presetDropdownRef = useRef<any>(null);
  const allTasksDropdownRef = useRef<any>(null);

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
      case 'deadline':
        defaultValue = 'no_deadline';
        defaultDisplayName = 'No Deadline';
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

  // Helper function to open dropdown by type
  const openDropdownByType = (type: ProcessingModeType) => {
    switch (type) {
      case 'project':
        projectDropdownRef.current?.openDropdown();
        break;
      case 'priority':
        priorityDropdownRef.current?.openDropdown();
        break;
      case 'label':
        labelDropdownRef.current?.openDropdown();
        break;
      case 'date':
        dateDropdownRef.current?.openDropdown();
        break;
      case 'deadline':
        deadlineDropdownRef.current?.openDropdown();
        break;
      case 'preset':
        presetDropdownRef.current?.openDropdown();
        break;
      case 'all':
        allTasksDropdownRef.current?.openDropdown();
        break;
    }
  };

  // Helper function to open current dropdown
  const openCurrentDropdown = () => {
    openDropdownByType(mode.type);
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    switchToMode: (type: ProcessingModeType) => {
      handleModeTypeChange(type);
      // Longer delay to ensure the dropdown is rendered and state is updated
      setTimeout(() => {
        openDropdownByType(type);
      }, 150);
    },
    openCurrentDropdown
  }), [mode.type, handleModeTypeChange]);

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
              ref={projectDropdownRef}
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
              ref={priorityDropdownRef}
              selectedPriority={mode.value as string}
              onPriorityChange={(priority, displayName) => {
                handleValueChange(priority, displayName);
              }}
              allTasks={filteredTasks}
            />
          )}

          {mode.type === 'label' && (
            <LabelDropdown
              ref={labelDropdownRef}
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
              ref={dateDropdownRef}
              selectedDate={mode.value as string}
              onDateChange={(date, displayName) => {
                handleValueChange(date, displayName);
              }}
              allTasks={filteredTasks}
            />
          )}

          {mode.type === 'deadline' && (
            <DeadlineDropdown
              ref={deadlineDropdownRef}
              selectedDeadline={mode.value as string}
              onDeadlineChange={(deadline, displayName) => {
                handleValueChange(deadline, displayName);
              }}
              allTasks={filteredTasks}
            />
          )}

          {mode.type === 'preset' && (
            <PresetDropdown
              ref={presetDropdownRef}
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
              ref={allTasksDropdownRef}
              selectedSort={mode.value as string}
              onSortChange={(sortBy, displayName) => {
                handleValueChange(sortBy, displayName);
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
            />
          )}
        </div>
        
      </div>
      </div>
    </div>
  );
});

ProcessingModeSelector.displayName = 'ProcessingModeSelector';

export default ProcessingModeSelector;