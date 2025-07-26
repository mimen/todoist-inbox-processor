'use client';

import React, { forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { TodoistTask, TodoistProject } from '@/lib/types';
import { ProcessingMode, ProcessingModeType } from '@/types/processing-mode';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { usePrioritizedOptions } from '@/hooks/usePrioritizedOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';
import { getDropdownConfig } from '@/utils/dropdown-config';

interface PrioritizedDropdownProps {
  selectedValue: string;
  onModeChange: (mode: ProcessingMode) => void;
  allTasks: TodoistTask[];
  projectMetadata: Record<string, any>;
  projects: TodoistProject[];
}

const PrioritizedDropdown = forwardRef<any, PrioritizedDropdownProps>(({
  selectedValue,
  onModeChange,
  allTasks,
  projectMetadata,
  projects
}: PrioritizedDropdownProps, ref) => {
  const dropdownRef = useRef<UnifiedDropdownRef>(null);
  const config = useQueueConfig();

  // Get prioritized options using the hook
  const prioritizedOptions = usePrioritizedOptions(
    allTasks,
    config.prioritizedQueue?.sequence || [],
    projectMetadata,
    projects
  );

  // Get dropdown configuration
  const dropdownConfig = getDropdownConfig('prioritized', config, {
    placeholder: 'Select queue...',
    selectionMode: 'single',
    searchable: true,
    showSort: false  // Disable sorting for prioritized dropdown
  });

  // Expose openDropdown method via ref
  useImperativeHandle(ref, () => ({
    openDropdown: () => {
      dropdownRef.current?.openDropdown();
    }
  }));

  const handleChange = (value: string | string[], displayName: string) => {
    const selectedOption = prioritizedOptions.find(opt => opt.id === value);
    if (!selectedOption) return;

    // For inbox project, we need to find the actual project ID
    let actualValue = value;
    if (selectedOption.type === 'project' && value === 'inbox') {
      // Find the actual inbox project ID
      const inboxProject = projects.find(p => p.isInboxProject);
      if (inboxProject) {
        actualValue = inboxProject.id;
      }
    }

    // Stay in prioritized mode but store the actual filter details in the value
    // Create a structured value that includes the type and actual value
    const prioritizedValue = {
      filterType: selectedOption.type,
      filterValue: actualValue,
      // Include metadata for priority projects
      isPriorityProject: selectedOption.metadata?.isPriorityProject || false
    };
    
    const mode: ProcessingMode = {
      type: 'prioritized',
      value: JSON.stringify(prioritizedValue), // Serialize to string
      displayName: selectedOption.label
    };

    onModeChange(mode);
  };

  // Extract the actual filter value from the composite for dropdown selection
  const dropdownValue = useMemo(() => {
    if (!selectedValue || selectedValue === '') return '';
    
    try {
      const parsed = JSON.parse(selectedValue);
      
      // Special handling for inbox - if the stored value is the numeric ID but the 
      // dropdown expects 'inbox', convert it back
      if (parsed.filterType === 'project' && parsed.filterValue) {
        const inboxProject = projects.find(p => p.isInboxProject);
        if (inboxProject && parsed.filterValue === inboxProject.id) {
          return 'inbox';
        }
      }
      
      return parsed.filterValue || '';
    } catch {
      // Fallback for non-JSON values
      return selectedValue;
    }
  }, [selectedValue, projects]);

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={prioritizedOptions}
      config={dropdownConfig}
      value={dropdownValue}
      onChange={handleChange}
      type="prioritized"
    />
  );
});

PrioritizedDropdown.displayName = 'PrioritizedDropdown';

export default PrioritizedDropdown;