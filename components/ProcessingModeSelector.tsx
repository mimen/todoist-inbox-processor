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
import PrioritizedDropdown from './PrioritizedDropdown';
import { AssigneeFilterType } from './AssigneeFilter';
import { TodoistTask, TodoistLabel, TodoistProject } from '@/lib/types';
import { useQueueProgression } from '@/hooks/useQueueProgression';
import { useCurrentModeOptions } from '@/hooks/useCurrentModeOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';
import { QueueProgressionState } from '@/types/queue';

export interface ProcessingModeSelectorRef {
  switchToMode: (type: ProcessingModeType) => void;
  openCurrentDropdown: () => void;
  queueState: QueueProgressionState;
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
  // Get queue config
  const queueConfig = useQueueConfig();

  // Refs for each dropdown
  const projectDropdownRef = useRef<any>(null);
  const priorityDropdownRef = useRef<any>(null);
  const labelDropdownRef = useRef<any>(null);
  const dateDropdownRef = useRef<any>(null);
  const deadlineDropdownRef = useRef<any>(null);
  const presetDropdownRef = useRef<any>(null);
  const allTasksDropdownRef = useRef<any>(null);
  const prioritizedDropdownRef = useRef<any>(null);

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

  // Get current mode options
  const currentModeOptions = useCurrentModeOptions({
    mode: mode.type,
    projects,
    allTasks: filteredTasks,
    labels,
    projectMetadata
  });

  // Use queue progression
  const queueState = useQueueProgression({
    mode: mode.type,
    dropdownOptions: currentModeOptions,
    config: queueConfig
  });

  const handleModeTypeChange = (newType: ProcessingModeType) => {
    // Change mode type and clear the value so tasks don't reload until user selects something
    let emptyValue: string | string[];
    let placeholderDisplayName: string;
    
    switch (newType) {
      case 'label':
        emptyValue = [];
        placeholderDisplayName = 'Select labels...';
        break;
      default:
        emptyValue = '';
        placeholderDisplayName = `Select ${newType}...`;
        break;
    }
    
    // Reset queue progression when changing modes
    // @ts-ignore - Accessing internal method
    if (queueState.resetQueueProgress) {
      queueState.resetQueueProgress();
    }
    
    onModeChange({
      type: newType,
      value: emptyValue,
      displayName: placeholderDisplayName
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
      case 'prioritized':
        prioritizedDropdownRef.current?.openDropdown();
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
      // Switch mode type
      handleModeTypeChange(type);
      // Longer delay to ensure the dropdown is rendered and state is updated
      setTimeout(() => {
        openDropdownByType(type);
      }, 150);
    },
    openCurrentDropdown,
    queueState
    // TODO: Future methods to expose:
    // getQueueHistory: () => completedQueues[]
    // skipToQueue: (queueId: string) => void
    // reorderQueues: (newOrder: string[]) => void
    // saveQueueState: () => void
    // loadQueueState: () => void
  }), [mode.type, handleModeTypeChange, queueState]);

  const handleValueChange = (value: string | string[], displayName: string) => {
    // Find the index of the selected option in the current queue
    const selectedIndex = currentModeOptions.findIndex(option => {
      if (Array.isArray(value)) {
        // For multi-select (labels), match if the arrays are equal
        return Array.isArray(option.id) && 
          value.length === option.id.length && 
          value.every(v => option.id.includes(v));
      }
      return option.id === value;
    });

    // Jump to the selected queue if found
    if (selectedIndex !== -1) {
      // @ts-ignore - Accessing internal method
      if (queueState.jumpToQueue) {
        queueState.jumpToQueue(selectedIndex);
      }
    }

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
                className="cursor-pointer font-normal flex items-center gap-1 text-gray-700"
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

          {mode.type === 'prioritized' && (
            <PrioritizedDropdown
              ref={prioritizedDropdownRef}
              selectedValue={mode.value as string}
              onModeChange={onModeChange}
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
              projects={projects}
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