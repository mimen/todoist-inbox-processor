'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { useAllOptions } from '@/hooks/useAllOptions';
import { DEFAULT_QUEUE_CONFIG } from '@/constants/queue-config';

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

  // Get all mode options using the hook
  const allOptions = useAllOptions(
    allTasks,
    DEFAULT_QUEUE_CONFIG.standardModes.all
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
        selectionMode: 'single',
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