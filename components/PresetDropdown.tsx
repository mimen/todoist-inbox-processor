'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TodoistTask } from '@/lib/types';
import UnifiedDropdown from './UnifiedDropdown';
import { UnifiedDropdownRef } from '@/types/dropdown';
import { usePresetOptions } from '@/hooks/usePresetOptions';
import { useQueueConfig } from '@/hooks/useQueueConfig';

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
  const queueConfig = useQueueConfig();

  // Get preset options using the hook
  const presetOptions = usePresetOptions(
    allTasks,
    projectMetadata,
    queueConfig.standardModes.preset
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
        selectionMode: queueConfig.standardModes.preset.multiSelect ? 'multi' : 'single',
        showSearch: false,
        showCounts: true,
        hierarchical: false,
        placeholder: 'Select preset filter...'
      }}
      value={selectedPreset}
      onChange={(value, displayName) => {
        onPresetChange(value as string, displayName);
      }}
      type="preset"
    />
  );
});

PresetDropdown.displayName = 'PresetDropdown';

export default PresetDropdown;