'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask, TodoistProject } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { useProjectOptions } from '@/hooks/useProjectOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';
import { getDropdownConfig } from '@/utils/dropdown-config';

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
  placeholder,
  includeInbox = true,
  className = "",
  allTasks = []
}: ProjectDropdownProps, ref) => {
  const dropdownRef = useRef<UnifiedDropdownRef>(null);
  const queueConfig = useQueueConfig();
  
  const projectOptions = useProjectOptions(projects, allTasks, queueConfig.standardModes.project);
  const config = getDropdownConfig('project', queueConfig, { placeholder });

  useImperativeHandle(ref, () => ({
    openDropdown: () => dropdownRef.current?.openDropdown()
  }));

  const handleProjectChange = (value: string | string[]) => {
    const singleValue = Array.isArray(value) ? value[0] : value;
    const projectId = singleValue === 'inbox' 
      ? projects.find(p => p.isInboxProject)?.id || singleValue
      : singleValue;
    onProjectChange(projectId as string);
  };

  const displayValue = config.selectionMode === 'multi'
    ? [selectedProjectId === projects.find(p => p.isInboxProject)?.id ? 'inbox' : selectedProjectId]
    : selectedProjectId === projects.find(p => p.isInboxProject)?.id ? 'inbox' : selectedProjectId;

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={projectOptions}
      config={config}
      value={displayValue}
      onChange={handleProjectChange}
      type="project"
      className={className}
      loading={allTasks.length === 0}
    />
  );
});

ProjectDropdown.displayName = 'ProjectDropdown';

export default ProjectDropdown;