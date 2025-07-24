'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ChevronDown } from 'lucide-react';
import { PRIORITY_LEVELS } from '@/types/processing-mode';
import { TodoistTask } from '@/lib/types';
import PriorityFlag from './PriorityFlag';

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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Expose openDropdown method via ref
  useImperativeHandle(ref, () => ({
    openDropdown: () => {
      setIsOpen(true);
      setSelectedIndex(0);
    }
  }));

  // Count tasks for each priority
  const priorityCounts = PRIORITY_LEVELS.reduce((counts, level) => {
    const priority = parseInt(level.value);
    counts[level.value] = allTasks.filter(task => 
      !task.content.startsWith("* ") && 
      task.priority === priority
    ).length;
    return counts;
  }, {} as Record<string, number>);

  // Get current priority display
  const currentPriority = PRIORITY_LEVELS.find(p => p.value === selectedPriority) || PRIORITY_LEVELS[0];
  
  // Calculate total tasks when no specific priority is selected
  const totalTasks = Object.values(priorityCounts).reduce((sum, count) => sum + count, 0);
  const displayCount = selectedPriority && priorityCounts[selectedPriority] !== undefined 
    ? priorityCounts[selectedPriority] 
    : totalTasks;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus dropdown when it opens
  useEffect(() => {
    if (isOpen && listRef.current) {
      setTimeout(() => {
        listRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, PRIORITY_LEVELS.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          const selected = PRIORITY_LEVELS[selectedIndex]
          if (selected) {
            handleSelect(selected)
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex])

  const handleSelect = (priority: typeof PRIORITY_LEVELS[0]) => {
    onPriorityChange(priority.value, priority.label);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
      >
        <div className="flex items-center space-x-3">
          <PriorityFlag priority={parseInt(currentPriority.value) as 1 | 2 | 3 | 4} />
          <span className="font-medium text-gray-900">
            {selectedPriority ? currentPriority.label : 'Select priority...'}
          </span>
          <span className="text-gray-500">
            ({displayCount})
          </span>
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
          <div 
            ref={listRef}
            className="max-h-64 overflow-y-auto"
            tabIndex={-1}
          >
            {PRIORITY_LEVELS.map((priority, index) => {
              const count = priorityCounts[priority.value] || 0;
              const isCurrentPriority = selectedPriority === priority.value;
              const isKeyboardSelected = index === selectedIndex;

              return (
                <button
                  key={priority.value}
                  onClick={() => handleSelect(priority)}
                  className={`
                    w-full p-3 text-left transition-colors
                    flex items-center justify-between
                    ${isCurrentPriority 
                      ? 'bg-blue-50 text-blue-900' 
                      : isKeyboardSelected 
                        ? 'bg-gray-100' 
                        : 'text-gray-900 hover:bg-gray-50'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <PriorityFlag priority={parseInt(priority.value) as 1 | 2 | 3 | 4} />
                    <span className={isCurrentPriority ? 'font-medium' : ''}>
                      {priority.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
})

PriorityDropdown.displayName = 'PriorityDropdown';

export default PriorityDropdown;