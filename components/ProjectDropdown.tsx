'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask, TodoistProject } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { useProjectOptions } from '@/hooks/useProjectOptions';
import { DEFAULT_QUEUE_CONFIG } from '@/constants/queue-config';

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

  // Get project options using the hook
  const projectOptions = useProjectOptions(
    projects,
    allTasks,
    DEFAULT_QUEUE_CONFIG.standardModes.project
  );

  // Expose openDropdown method via ref
  useImperativeHandle(ref, () => ({
    openDropdown: () => {
      dropdownRef.current?.openDropdown();
    }
  }));

  // Handle special case for inbox selection
  const handleProjectChange = (value: string | string[], displayName: string) => {
    const projectId = value === 'inbox' 
      ? projects.find(p => p.isInboxProject)?.id || value
      : value;
    onProjectChange(projectId as string);
  };

  // Map selected ID for display (handle inbox special case)
  const displayValue = selectedProjectId === projects.find(p => p.isInboxProject)?.id 
    ? 'inbox' 
    : selectedProjectId;

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={projectOptions}
      config={{
        selectionMode: 'single',
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