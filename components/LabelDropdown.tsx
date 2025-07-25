'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask, TodoistLabel } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { useLabelOptions } from '@/hooks/useLabelOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';
import { useDropdownAdapter } from '@/hooks/useDropdownAdapter';
import { getDropdownConfig } from '@/utils/dropdown-config';

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

  // Convert label names to IDs for value
  const selectedLabelIds = selectedLabels.map(labelName => {
    const labelObj = labelObjects.find(l => l.name === labelName);
    return labelObj?.id || labelName;
  });

  // Get config first to ensure consistency
  const config = getDropdownConfig('label', queueConfig);
  const isMultiSelect = config.selectionMode === 'multi';

  // Use adapter to handle single/multi select standardization
  const { dropdownValue, handleDropdownChange } = useDropdownAdapter(
    isMultiSelect,
    selectedLabelIds,
    (ids, displayName) => {
      // Convert IDs back to names
      const names = ids.map(id => {
        const labelObj = labelObjects.find(l => l.id === id);
        return labelObj?.name || id;
      });
      onLabelsChange(names, displayName);
    }
  );

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