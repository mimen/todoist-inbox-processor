'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DEADLINE_OPTIONS } from '@/types/processing-mode';
import { TodoistTask } from '@/lib/types';

interface DeadlineDropdownProps {
  selectedDeadline: string;
  onDeadlineChange: (deadline: string, displayName: string) => void;
  allTasks: TodoistTask[];
  selectedIndex?: number;
}

export default function DeadlineDropdown({
  selectedDeadline,
  onDeadlineChange,
  allTasks,
  selectedIndex = 0
}: DeadlineDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyboardSelectedIndex, setKeyboardSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Count tasks for each deadline option
  const deadlineCounts = DEADLINE_OPTIONS.reduce((counts, option) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    counts[option.value] = allTasks.filter(task => {
      if (task.content.startsWith("* ")) return false;
      
      switch (option.value) {
        case 'overdue':
          if (!task.deadline) return false;
          const deadlineDate = new Date(task.deadline.date);
          return deadlineDate < today;
        
        case 'today':
          if (!task.deadline) return false;
          return task.deadline.date === today.toISOString().split('T')[0];
        
        case 'next_7_days':
          if (!task.deadline) return false;
          const taskDeadline = new Date(task.deadline.date);
          return taskDeadline >= today && taskDeadline <= nextWeek;
        
        case 'upcoming':
          if (!task.deadline) return false;
          const upcomingDeadline = new Date(task.deadline.date);
          return upcomingDeadline > nextWeek;
        
        case 'no_deadline':
          return !task.deadline;
        
        default:
          return false;
      }
    }).length;
    return counts;
  }, {} as Record<string, number>);

  // Get current deadline option display
  const currentOption = DEADLINE_OPTIONS.find(d => d.value === selectedDeadline) || DEADLINE_OPTIONS[0];

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
          setKeyboardSelectedIndex(prev => Math.min(prev + 1, DEADLINE_OPTIONS.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setKeyboardSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          const selected = DEADLINE_OPTIONS[keyboardSelectedIndex]
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
  }, [isOpen, keyboardSelectedIndex])

  const handleSelect = (option: typeof DEADLINE_OPTIONS[0]) => {
    onDeadlineChange(option.value, option.label);
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
          <span className={currentOption.color}>
            {currentOption.icon}
          </span>
          <span className="font-medium text-gray-900">{currentOption.label}</span>
          <span className="text-gray-500">
            ({deadlineCounts[selectedDeadline] || 0})
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
          <div className="max-h-64 overflow-y-auto">
            {DEADLINE_OPTIONS.map((option, index) => {
              const count = deadlineCounts[option.value] || 0;
              const isCurrentDeadline = selectedDeadline === option.value;
              const isKeyboardSelected = index === keyboardSelectedIndex;

              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full p-3 text-left transition-colors
                    flex items-center justify-between
                    ${isCurrentDeadline 
                      ? 'bg-blue-50 text-blue-900' 
                      : isKeyboardSelected 
                        ? 'bg-gray-100' 
                        : 'text-gray-900 hover:bg-gray-50'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className={option.color}>
                      {option.icon}
                    </span>
                    <span className={isCurrentDeadline ? 'font-medium' : ''}>
                      {option.label}
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
}