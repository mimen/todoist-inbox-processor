'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { TodoistTask, TodoistLabel } from '@/lib/types';
import LabelIcon from './LabelIcon';

interface LabelDropdownProps {
  selectedLabels: string[];
  onLabelsChange: (labels: string[], displayName: string) => void;
  availableLabels: string[];
  allTasks: TodoistTask[];
  labelObjects?: TodoistLabel[];
}

export default function LabelDropdown({
  selectedLabels,
  onLabelsChange,
  availableLabels,
  allTasks,
  labelObjects = []
}: LabelDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Count tasks for each label
  const labelCounts = availableLabels.reduce((counts, label) => {
    counts[label] = allTasks.filter(task => 
      !task.content.startsWith("* ") && 
      task.labels.includes(label)
    ).length;
    return counts;
  }, {} as Record<string, number>);

  // Filter and sort labels based on search and task count
  const filteredLabels = availableLabels
    .filter(label => label.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const countA = labelCounts[a] || 0;
      const countB = labelCounts[b] || 0;
      return countB - countA; // Sort by count descending
    });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleLabel = (label: string) => {
    const newLabels = selectedLabels.includes(label)
      ? selectedLabels.filter(l => l !== label)
      : [...selectedLabels, label];
    
    const displayName = newLabels.length === 0
      ? 'Select labels...'
      : newLabels.length === 1
      ? `@${newLabels[0]}`
      : `${newLabels.length} labels`;
    
    onLabelsChange(newLabels, displayName);
  };

  const clearAll = () => {
    onLabelsChange([], 'Select labels...');
  };

  const getSelectedCount = () => {
    if (selectedLabels.length === 0) return 0;
    return allTasks.filter(task => 
      !task.content.startsWith("* ") && 
      selectedLabels.some(label => task.labels.includes(label))
    ).length;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
      >
        <div className="flex items-center space-x-3">
          <LabelIcon className="w-4 h-4" />
          <span className="font-medium text-gray-900">
            {selectedLabels.length === 0
              ? 'Select labels...'
              : selectedLabels.length === 1
              ? `@${selectedLabels[0]}`
              : `${selectedLabels.length} labels`}
          </span>
          {selectedLabels.length > 0 && (
            <span className="text-gray-500">
              ({getSelectedCount()})
            </span>
          )}
        </div>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search labels..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-todoist-blue focus:border-transparent text-sm"
              autoFocus
            />
          </div>

          {selectedLabels.length > 0 && (
            <div className="p-3 border-b border-gray-200">
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {filteredLabels.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No labels found
              </div>
            ) : (
              <div className="py-1">
                {filteredLabels.map((label) => {
                  const isSelected = selectedLabels.includes(label);
                  const count = labelCounts[label] || 0;

                  return (
                    <button
                      key={label}
                      onClick={() => toggleLabel(label)}
                      className={`
                        w-full p-3 text-left hover:bg-gray-50 transition-colors
                        flex items-center justify-between
                        ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 flex items-center justify-center rounded border ${
                          isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <LabelIcon 
                          color={labelObjects.find(l => l.name === label)?.color || '47'}
                          className="w-4 h-4" 
                        />
                        <span className={isSelected ? 'font-medium' : ''}>
                          @{label}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedLabels.length > 1 && (
            <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
              Showing tasks with any of the selected labels
            </div>
          )}
        </div>
      )}
    </div>
  );
}