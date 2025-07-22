'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { TodoistTask } from '@/lib/types';
import { SORT_OPTIONS } from '@/types/processing-mode';

interface AllTasksDropdownProps {
  selectedSort: string;
  onSortChange: (sortBy: string, displayName: string) => void;
  allTasks: TodoistTask[];
}

export default function AllTasksDropdown({
  selectedSort,
  onSortChange,
  allTasks
}: AllTasksDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const taskCount = allTasks.length;

  // Get current sort option display
  const currentOption = SORT_OPTIONS.find(s => s.value === selectedSort) || SORT_OPTIONS[0];

  // Close dropdown when clicking outside
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

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, SORT_OPTIONS.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          const selected = SORT_OPTIONS[selectedIndex]
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

  const handleSelect = (option: typeof SORT_OPTIONS[0]) => {
    onSortChange(option.value, option.label);
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
          <span className="text-gray-500">📊</span>
          <span className="font-medium text-gray-900">{currentOption.label}</span>
          <span className="text-gray-500">
            ({taskCount})
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="max-h-64 overflow-y-auto">
            {SORT_OPTIONS.map((option, index) => {
              const isCurrentSort = selectedSort === option.value;
              const isKeyboardSelected = index === selectedIndex;

              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full p-3 text-left transition-colors
                    flex items-center justify-between
                    ${isCurrentSort 
                      ? 'bg-blue-50 text-blue-900' 
                      : isKeyboardSelected 
                        ? 'bg-gray-100' 
                        : 'text-gray-900 hover:bg-gray-50'}
                  `}
                >
                  <div className="flex flex-col">
                    <span className={isCurrentSort ? 'font-medium' : ''}>
                      {option.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {option.description}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {taskCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}