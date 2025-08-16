'use client';

import React, { useState, useImperativeHandle, forwardRef, useRef, useEffect, useMemo } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ProcessingMode, ProcessingModeType, PROCESSING_MODE_OPTIONS } from '@/types/processing-mode';
import {
  ProjectDropdown,
  PriorityDropdown,
  LabelDropdown,
  DateDropdown,
  DeadlineDropdown,
  PresetDropdown,
  AllTasksDropdown,
  PrioritizedDropdown
} from '../dropdowns';
import { AssigneeFilterType } from './AssigneeFilter';
import { TodoistTask, TodoistLabel, TodoistProject } from '@/lib/types';
import { useQueueProgression } from '@/hooks/useQueueProgression';
import { useCurrentModeOptions } from '@/hooks/useCurrentModeOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';
import { QueueProgressionState } from '@/types/queue';
import { sortDropdownOptions } from '@/utils/dropdown-sorting';
import { getDefaultSortOption, SortOption } from '@/constants/dropdown-sort-options';

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
  
  // Track the selected processing type separately from the active processing mode
  // This allows the UI to show the correct dropdown without changing the display name prematurely
  const [selectedProcessingType, setSelectedProcessingType] = useState<ProcessingModeType>(mode.type as ProcessingModeType);
  
  // Track sort state for each mode type
  const [sortStates, setSortStates] = useState<Record<string, SortOption>>({});
  
  // Get current sort for the active mode
  const currentSort = useMemo(() => {
    const modeType = mode.type.startsWith('custom:') ? 'preset' : mode.type as ProcessingModeType;
    return sortStates[modeType] || getDefaultSortOption(modeType);
  }, [mode.type, sortStates]);
  
  // Handle sort changes from dropdowns
  const handleSortChange = (sort: SortOption) => {
    const modeType = mode.type.startsWith('custom:') ? 'preset' : mode.type as ProcessingModeType;
    setSortStates(prev => ({
      ...prev,
      [modeType]: sort
    }));
  };
  
  // Sync selectedProcessingType when mode changes externally (e.g., when tasks are loaded)
  React.useEffect(() => {
    setSelectedProcessingType(mode.type as ProcessingModeType);
  }, [mode.type]);

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
    mode: mode.type.startsWith('custom:') ? 'preset' : mode.type as ProcessingModeType,
    projects,
    allTasks: filteredTasks,
    labels,
    projectMetadata
  });

  // Apply sorting to options based on current sort state
  const sortedOptions = useMemo(() => {
    if (!currentSort) return currentModeOptions;
    
    const sortConfig = {
      sortBy: currentSort.value,
      sortDirection: currentSort.direction
    };
    
    return sortDropdownOptions(currentModeOptions, sortConfig, currentSort.value);
  }, [currentModeOptions, currentSort]);

  // Use queue progression with sorted options
  const queueState = useQueueProgression({
    currentValue: mode.value,
    dropdownOptions: sortedOptions,
    config: queueConfig
  });

  const handleModeTypeChange = (newType: ProcessingModeType) => {
    // Only update the UI state for showing the correct dropdown
    // Don't change the processing mode until user selects a specific value
    // This prevents premature display name changes and metadata hiding
    
    setSelectedProcessingType(newType);
    
    // Don't call onModeChange here - let the dropdown selection handle it
    // The radio button selection just controls which dropdown is visible
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
    const modeType = mode.type.startsWith('custom:') ? 'preset' : mode.type;
    openDropdownByType(modeType as ProcessingModeType);
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
  }), [mode.type, handleModeTypeChange, queueState]);

  const handleValueChange = (value: string | string[], displayName: string) => {
    // Simply update the mode - the queue progression hook will automatically
    // find the correct position based on the value
    onModeChange({
      ...mode,
      type: selectedProcessingType,
      value,
      displayName
    });
  };

  // Extract unique labels from all tasks and match with label objects
  const allLabelNames = Array.from(
    new Set(allTasks.flatMap(task => task.labels))
  ).sort();

  return (
    <div className="px-4 py-2 space-y-2">
      <div className="flex items-center">
        <RadioGroup
          value={selectedProcessingType}
          onValueChange={(value) => handleModeTypeChange(value as ProcessingModeType)}
          className="flex flex-row gap-2"
        >
          {PROCESSING_MODE_OPTIONS.map((option) => (
            <div key={option.type} className="flex items-center">
              <RadioGroupItem value={option.type} id={option.type} className="peer sr-only" />
              <Label 
                htmlFor={option.type} 
                className={`cursor-pointer px-3 py-1 text-xs font-medium rounded-full transition-all
                         ${selectedProcessingType === option.type 
                           ? 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700' 
                           : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                         }`}
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <div className="w-full">
          {selectedProcessingType === 'project' && (
            <ProjectDropdown
              ref={projectDropdownRef}
              projects={projects}
              selectedProjectId={mode.value as string}
              onProjectChange={(projectId) => {
                const project = projects.find(p => p.id === projectId);
                handleValueChange(projectId, project?.name || 'Unknown');
              }}
              allTasks={filteredTasks}
              currentSort={currentSort}
              onSortChange={handleSortChange}
            />
          )}

          {selectedProcessingType === 'priority' && (
            <PriorityDropdown
              ref={priorityDropdownRef}
              selectedPriority={mode.value as string}
              onPriorityChange={(priority, displayName) => {
                handleValueChange(priority, displayName);
              }}
              allTasks={filteredTasks}
            />
          )}

          {selectedProcessingType === 'label' && (
            <LabelDropdown
              ref={labelDropdownRef}
              selectedLabels={mode.value ? [mode.value as string] : []}
              onLabelsChange={(labels, displayName) => {
                // Take only the first label since we're in single-select mode
                const singleLabel = labels[0] || '';
                handleValueChange(singleLabel, displayName);
              }}
              availableLabels={allLabelNames}
              allTasks={filteredTasks}
              labelObjects={labels}
            />
          )}

          {selectedProcessingType === 'date' && (
            <DateDropdown
              ref={dateDropdownRef}
              selectedDate={mode.value as string}
              onDateChange={(date, displayName) => {
                handleValueChange(date, displayName);
              }}
              allTasks={filteredTasks}
            />
          )}

          {selectedProcessingType === 'deadline' && (
            <DeadlineDropdown
              ref={deadlineDropdownRef}
              selectedDeadline={mode.value as string}
              onDeadlineChange={(deadline, displayName) => {
                handleValueChange(deadline, displayName);
              }}
              allTasks={filteredTasks}
            />
          )}

          {selectedProcessingType === 'preset' && (
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

          {selectedProcessingType === 'all' && (
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

          {selectedProcessingType === 'prioritized' && (
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
  );
});

ProcessingModeSelector.displayName = 'ProcessingModeSelector';

export default ProcessingModeSelector;