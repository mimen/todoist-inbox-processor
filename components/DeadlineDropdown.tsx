'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { useDeadlineOptions } from '@/hooks/useDeadlineOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';

interface DeadlineDropdownProps {
  selectedDeadline: string;
  onDeadlineChange: (deadline: string, displayName: string) => void;
  allTasks: TodoistTask[];
}

const DeadlineDropdown = forwardRef<any, DeadlineDropdownProps>(({
  selectedDeadline,
  onDeadlineChange,
  allTasks
}: DeadlineDropdownProps, ref) => {
  const dropdownRef = useRef<UnifiedDropdownRef>(null);
  const queueConfig = useQueueConfig();

  // Get deadline options using the hook
  const deadlineOptions = useDeadlineOptions(
    allTasks,
    queueConfig.standardModes.deadline
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
      options={deadlineOptions}
      config={{
        selectionMode: queueConfig.standardModes.deadline?.multiSelect ? 'multi' : 'single',
        showSearch: false,
        showCounts: true,
        hierarchical: false,
        placeholder: 'Select deadline range...'
      }}
      value={selectedDeadline}
      onChange={(value, displayName) => {
        onDeadlineChange(value as string, displayName);
      }}
      type="deadline"
    />
  );
});

DeadlineDropdown.displayName = 'DeadlineDropdown';

export default DeadlineDropdown;