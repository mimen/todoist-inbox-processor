'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { usePresetOptions } from '@/hooks/usePresetOptions';
import { DEFAULT_QUEUE_CONFIG } from '@/constants/queue-config';

interface PresetDropdownProps {
  selectedPreset: string;
  onPresetChange: (presetId: string, displayName: string) => void;
  allTasks: TodoistTask[];
  projectMetadata?: Record<string, any>;
}

const PresetDropdown = forwardRef<any, PresetDropdownProps>(({
  selectedPreset,
  onPresetChange,
  allTasks,
  projectMetadata = {}
}: PresetDropdownProps, ref) => {
  const dropdownRef = useRef<UnifiedDropdownRef>(null);

  // Get preset options using the hook
  const presetOptions = usePresetOptions(
    allTasks,
    projectMetadata,
    DEFAULT_QUEUE_CONFIG.standardModes.preset
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
      options={presetOptions}
      config={{
        selectionMode: 'single',
        showSearch: false,
        showCounts: true,
        hierarchical: false,
        placeholder: 'Select preset filter...'
      }}
      value={selectedPreset}
      onChange={(value, displayName) => {
        onPresetChange(value as string, displayName);
      }}
    />
  );
});

PresetDropdown.displayName = 'PresetDropdown';

export default PresetDropdown;