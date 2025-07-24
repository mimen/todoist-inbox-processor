'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { useFilterOptions, TodoistFilter } from '@/hooks/useFilterOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';
import { getDropdownConfig } from '@/utils/dropdown-config';

interface FilterDropdownProps {
  selectedFilter: string;
  onFilterChange: (filterId: string, displayName: string, query: string) => void;
  allTasks: TodoistTask[];
  filters: TodoistFilter[];
}

const FilterDropdown = forwardRef<any, FilterDropdownProps>(({
  selectedFilter,
  onFilterChange,
  allTasks,
  filters
}: FilterDropdownProps, ref) => {
  const dropdownRef = useRef<UnifiedDropdownRef>(null);
  const queueConfig = useQueueConfig();
  
  const filterOptions = useFilterOptions(filters, allTasks, queueConfig.standardModes.preset);
  const config = getDropdownConfig('preset', queueConfig, { placeholder: 'Select filter...' });

  useImperativeHandle(ref, () => ({
    openDropdown: () => dropdownRef.current?.openDropdown()
  }));

  const handleFilterChange = (value: string | string[], displayName: string) => {
    const filterId = Array.isArray(value) ? value[0] : value;
    const filter = filters.find(f => f.id === filterId);
    if (filter) {
      onFilterChange(filter.id, filter.name, filter.query);
    }
  };

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={filterOptions}
      config={config}
      value={selectedFilter}
      onChange={handleFilterChange}
    />
  );
})

FilterDropdown.displayName = 'FilterDropdown';

export default FilterDropdown;