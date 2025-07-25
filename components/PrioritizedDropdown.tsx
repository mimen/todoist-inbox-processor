'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
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
    searchable: true
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

    // Determine the processing mode based on the selected option
    let mode: ProcessingMode;

    // Check if this is a priority project (expanded from priority-projects)
    if (selectedOption.type === 'project' && selectedOption.metadata?.isPriorityProject) {
      mode = {
        type: 'project',
        value: selectedOption.id,
        displayName: selectedOption.label
      };
    } else {
      // Find the original configuration item to determine the correct type
      const configItem = config.prioritizedQueue?.sequence.find(
        item => {
          // Match by value for direct items
          if (item.value === value) return true;
          
          // For priority-projects, check if this option was expanded from it
          if (item.type === 'priority-projects' && selectedOption.type === 'project') {
            const targetPriority = parseInt(item.value);
            const metadata = projectMetadata[selectedOption.id];
            return metadata?.priority === targetPriority;
          }
          
          return false;
        }
      );

      if (configItem && configItem.type !== 'priority-projects') {
        // Direct mapping for non-expanded items
        mode = {
          type: configItem.type as ProcessingModeType,
          value: value as string,
          displayName: selectedOption.label
        };
      } else {
        // Default to the option's type
        mode = {
          type: selectedOption.type as ProcessingModeType,
          value: value as string,
          displayName: selectedOption.label
        };
      }
    }

    onModeChange(mode);
  };

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={prioritizedOptions}
      config={dropdownConfig}
      value={selectedValue}
      onChange={handleChange}
      type="prioritized"
    />
  );
});

PrioritizedDropdown.displayName = 'PrioritizedDropdown';

export default PrioritizedDropdown;