'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask, TodoistProject } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { useProjectOptions } from '@/hooks/useProjectOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';

interface ProjectDropdownProps {
  projects: TodoistProject[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  placeholder?: string;
  includeInbox?: boolean;
  className?: string;
  allTasks?: TodoistTask[];
}

const ProjectDropdown = forwardRef<any, ProjectDropdownProps>(({
  projects,
  selectedProjectId,
  onProjectChange,
  placeholder = "Select project...",
  includeInbox = true,
  className = "",
  allTasks = []
}: ProjectDropdownProps, ref) => {
  const dropdownRef = useRef<UnifiedDropdownRef>(null);
  const queueConfig = useQueueConfig();

  // Get project options using the hook
  const projectOptions = useProjectOptions(
    projects,
    allTasks,
    queueConfig.standardModes.project
  );

  // Expose openDropdown method via ref
  useImperativeHandle(ref, () => ({
    openDropdown: () => {
      dropdownRef.current?.openDropdown();
    }
  }));

  // Handle special case for inbox selection
  const handleProjectChange = (value: string | string[], displayName: string) => {
    // For now, only handle single selection even in multi-select mode
    // TODO: Update parent components (ProcessingModeSelector, task filtering) to handle array of project IDs
    // Multi-select UI will work but only first selection will be used for filtering
    const singleValue = Array.isArray(value) ? value[0] : value;
    const projectId = singleValue === 'inbox' 
      ? projects.find(p => p.isInboxProject)?.id || singleValue
      : singleValue;
    onProjectChange(projectId as string);
  };

  // Map selected ID for display (handle inbox special case)
  // For multi-select, we need to handle arrays
  const displayValue = queueConfig.standardModes.project.multiSelect
    ? [selectedProjectId === projects.find(p => p.isInboxProject)?.id ? 'inbox' : selectedProjectId]
    : selectedProjectId === projects.find(p => p.isInboxProject)?.id 
      ? 'inbox' 
      : selectedProjectId;

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={projectOptions}
      config={{
        selectionMode: queueConfig.standardModes.project.multiSelect ? 'multi' : 'single',
        showSearch: true,
        showCounts: true,
        hierarchical: true,
        placeholder
      }}
      value={displayValue}
      onChange={handleProjectChange}
      className={className}
      loading={allTasks.length === 0}
    />
  );
});

ProjectDropdown.displayName = 'ProjectDropdown';

export default ProjectDropdown;