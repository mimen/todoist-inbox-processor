'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask, TodoistLabel } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { useLabelOptions } from '@/hooks/useLabelOptions';
import { DEFAULT_QUEUE_CONFIG } from '@/constants/queue-config';

interface LabelDropdownProps {
  selectedLabels: string[];
  onLabelsChange: (labels: string[], displayName: string) => void;
  availableLabels: string[];
  allTasks: TodoistTask[];
  labelObjects?: TodoistLabel[];
}

const LabelDropdown = forwardRef<any, LabelDropdownProps>(({
  selectedLabels,
  onLabelsChange,
  availableLabels,
  allTasks,
  labelObjects = []
}: LabelDropdownProps, ref) => {
  const dropdownRef = useRef<UnifiedDropdownRef>(null);

  // Get label options using the hook
  const labelOptions = useLabelOptions(
    labelObjects,
    allTasks,
    DEFAULT_QUEUE_CONFIG.standardModes.label
  );

  // Expose openDropdown method via ref
  useImperativeHandle(ref, () => ({
    openDropdown: () => {
      dropdownRef.current?.openDropdown();
    }
  }));

  // Convert label names to IDs for value
  const selectedLabelIds = selectedLabels.map(labelName => {
    const labelObj = labelObjects.find(l => l.name === labelName);
    return labelObj?.id || labelName;
  });

  // Convert back to names when changing
  const handleLabelsChange = (value: string | string[], displayName: string) => {
    const ids = value as string[];
    const names = ids.map(id => {
      const labelObj = labelObjects.find(l => l.id === id);
      return labelObj?.name || id;
    });
    onLabelsChange(names, displayName);
  };

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={labelOptions}
      config={{
        selectionMode: 'multi',
        showSearch: true,
        showCounts: true,
        hierarchical: false,
        placeholder: 'Select labels...'
      }}
      value={selectedLabelIds}
      onChange={handleLabelsChange}
    />
  );
});

LabelDropdown.displayName = 'LabelDropdown';

export default LabelDropdown;