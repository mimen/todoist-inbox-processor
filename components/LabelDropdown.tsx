'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask, TodoistLabel } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { useLabelOptions } from '@/hooks/useLabelOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';
import { getDropdownConfig } from '@/utils/dropdown-config';

interface LabelDropdownProps {
  selectedLabels: string[]; // For backward compatibility with ProcessingModeSelector
  onLabelsChange: (labels: string[], displayName: string) => void; // For backward compatibility
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
  const queueConfig = useQueueConfig();

  // Get label options using the hook
  const labelOptions = useLabelOptions(
    labelObjects,
    allTasks,
    queueConfig.standardModes.label
  );

  // Expose openDropdown method via ref
  useImperativeHandle(ref, () => ({
    openDropdown: () => {
      dropdownRef.current?.openDropdown();
    }
  }));

  // Get config first to ensure consistency
  const config = getDropdownConfig('label', queueConfig);

  // Convert single label name to ID for dropdown
  const selectedLabelId = selectedLabels[0] || '';
  const selectedLabelObj = labelObjects.find(l => l.name === selectedLabelId);
  const dropdownValue = selectedLabelObj?.id || selectedLabelId;

  // Handle dropdown changes - convert back to label name array
  const handleDropdownChange = (value: string | string[], displayName: string) => {
    const singleValue = Array.isArray(value) ? value[0] : value;
    if (singleValue) {
      const labelObj = labelObjects.find(l => l.id === singleValue);
      const labelName = labelObj?.name || singleValue;
      onLabelsChange([labelName], displayName);
    } else {
      onLabelsChange([], displayName);
    }
  };

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={labelOptions}
      config={config}
      value={dropdownValue}
      onChange={handleDropdownChange}
      type="label"
    />
  );
});

LabelDropdown.displayName = 'LabelDropdown';

export default LabelDropdown;