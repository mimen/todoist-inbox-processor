'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { useDateOptions } from '@/hooks/useDateOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';
import { getDropdownConfig } from '@/utils/dropdown-config';

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
  
  const dateOptions = useDateOptions(allTasks, queueConfig.standardModes.date);
  const config = getDropdownConfig('date', queueConfig);

  useImperativeHandle(ref, () => ({
    openDropdown: () => dropdownRef.current?.openDropdown()
  }));

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={dateOptions}
      config={config}
      value={selectedDate}
      onChange={(value, displayName) => {
        onDateChange(value as string, displayName);
      }}
    />
  );
});

DateDropdown.displayName = 'DateDropdown';

export default DateDropdown;