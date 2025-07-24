'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { useDateOptions } from '@/hooks/useDateOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';

interface DateDropdownProps {
  selectedDate: string;
  onDateChange: (date: string, displayName: string) => void;
  allTasks: TodoistTask[];
}

const DateDropdown = forwardRef<any, DateDropdownProps>(({
  selectedDate,
  onDateChange,
  allTasks
}: DateDropdownProps, ref) => {
  const dropdownRef = useRef<UnifiedDropdownRef>(null);
  const queueConfig = useQueueConfig();

  // Get date options using the hook
  const dateOptions = useDateOptions(
    allTasks,
    queueConfig.standardModes.date
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
      options={dateOptions}
      config={{
        selectionMode: queueConfig.standardModes.date.multiSelect ? 'multi' : 'single',
        showSearch: false,
        showCounts: true,
        hierarchical: false,
        placeholder: 'Select date range...'
      }}
      value={selectedDate}
      onChange={(value, displayName) => {
        onDateChange(value as string, displayName);
      }}
    />
  );
});

DateDropdown.displayName = 'DateDropdown';

export default DateDropdown;