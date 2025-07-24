'use client';

import React, { forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { TodoistTask } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { usePriorityOptions } from '@/hooks/usePriorityOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';

interface PriorityDropdownProps {
  selectedPriority: string;
  onPriorityChange: (priority: string, displayName: string) => void;
  allTasks: TodoistTask[];
}

const PriorityDropdown = forwardRef<any, PriorityDropdownProps>(({
  selectedPriority,
  onPriorityChange,
  allTasks
}: PriorityDropdownProps, ref) => {
  const dropdownRef = useRef<UnifiedDropdownRef>(null);
  const queueConfig = useQueueConfig();

  // Get priority options using the hook
  const priorityOptions = usePriorityOptions(
    allTasks,
    queueConfig.standardModes.priority
  );

  // Expose openDropdown method via ref
  useImperativeHandle(ref, () => ({
    openDropdown: () => {
      dropdownRef.current?.openDropdown();
    }
  }));

  // Calculate display name for consistency
  const getDisplayName = (value: string) => {
    const option = priorityOptions.find(opt => opt.id === value);
    return option?.label || 'Select priority...';
  };

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={priorityOptions}
      config={{
        selectionMode: queueConfig.standardModes.priority.multiSelect ? 'multi' : 'single',
        showSearch: false,
        showCounts: true,
        hierarchical: false,
        placeholder: 'Select priority...'
      }}
      value={selectedPriority}
      onChange={(value, displayName) => {
        onPriorityChange(value as string, displayName);
      }}
    />
  );
});

PriorityDropdown.displayName = 'PriorityDropdown';

export default PriorityDropdown;