'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { useAllOptions } from '@/hooks/useAllOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';

interface AllTasksDropdownProps {
  selectedSort: string;
  onSortChange: (sortBy: string, displayName: string) => void;
  allTasks: TodoistTask[];
}

const AllTasksDropdown = forwardRef<any, AllTasksDropdownProps>(({
  selectedSort,
  onSortChange,
  allTasks
}: AllTasksDropdownProps, ref) => {
  const dropdownRef = useRef<UnifiedDropdownRef>(null);
  const queueConfig = useQueueConfig();

  // Get all mode options using the hook
  const allOptions = useAllOptions(
    allTasks,
    queueConfig.standardModes.all
  );

  // Expose openDropdown method via ref
  useImperativeHandle(ref, () => ({
    openDropdown: () => {
      dropdownRef.current?.openDropdown();
    }
  }));

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={allOptions}
      config={{
        selectionMode: queueConfig.standardModes.all?.multiSelect ? 'multi' : 'single',
        showSearch: false,
        showCounts: true,
        hierarchical: false,
        placeholder: 'Select sort order...'
      }}
      value={selectedSort}
      onChange={(value, displayName) => {
        onSortChange(value as string, displayName);
      }}
    />
  );
});

AllTasksDropdown.displayName = 'AllTasksDropdown';

export default AllTasksDropdown;