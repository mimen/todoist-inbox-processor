'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { usePriorityOptions } from '@/hooks/usePriorityOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';
import { getDropdownConfig } from '@/utils/dropdown-config';

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
  
  const priorityOptions = usePriorityOptions(allTasks, queueConfig.standardModes.priority);
  const config = getDropdownConfig('priority', queueConfig);

  useImperativeHandle(ref, () => ({
    openDropdown: () => dropdownRef.current?.openDropdown()
  }));

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={priorityOptions}
      config={config}
      value={selectedPriority}
      onChange={(value, displayName) => onPriorityChange(value as string, displayName)}
    />
  );
});

PriorityDropdown.displayName = 'PriorityDropdown';

export default PriorityDropdown;