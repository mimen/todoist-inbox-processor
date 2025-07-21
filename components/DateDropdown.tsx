'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DATE_OPTIONS } from '@/types/processing-mode';
import { TodoistTask } from '@/lib/types';

// Helper function to detect recurring tasks
function isRecurringTask(task: TodoistTask): boolean {
  if (!task.due) return false;
  
  // Check if the due string contains recurring patterns
  const recurringPatterns = [
    'every',
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'weekday',
    'weekend'
  ];
  
  const dueString = task.due.string?.toLowerCase() || '';
  return recurringPatterns.some(pattern => dueString.includes(pattern)) || task.due.recurring === true;
}

interface DateDropdownProps {
  selectedDate: string;
  onDateChange: (date: string, displayName: string) => void;
  allTasks: TodoistTask[];
}

export default function DateDropdown({
  selectedDate,
  onDateChange,
  allTasks
}: DateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Count tasks for each date option
  const dateCounts = DATE_OPTIONS.reduce((counts, option) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    counts[option.value] = allTasks.filter(task => {
      if (task.content.startsWith("* ")) return false;
      
      switch (option.value) {
        case 'overdue':
          if (!task.due) return false;
          const dueDate = new Date(task.due.date);
          return dueDate < today;
        
        case 'today':
          if (!task.due) return false;
          return task.due.date === today.toISOString().split('T')[0];
        
        case 'next_7_days':
          if (!task.due) return false;
          const taskDate = new Date(task.due.date);
          return taskDate >= today && taskDate <= nextWeek;
        
        case 'scheduled':
          return !!task.due && !isRecurringTask(task);
        
        case 'recurring':
          return !!task.due && isRecurringTask(task);
        
        case 'no_date':
          return !task.due;
        
        default:
          return false;
      }
    }).length;
    return counts;
  }, {} as Record<string, number>);

  // Get current date option display
  const currentOption = DATE_OPTIONS.find(d => d.value === selectedDate) || DATE_OPTIONS[0];

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

  const handleSelect = (option: typeof DATE_OPTIONS[0]) => {
    onDateChange(option.value, option.label);
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
            ({dateCounts[selectedDate] || 0})
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
            {DATE_OPTIONS.map((option) => {
              const count = dateCounts[option.value] || 0;
              const isSelected = selectedDate === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full p-3 text-left hover:bg-gray-50 transition-colors
                    flex items-center justify-between
                    ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className={option.color}>
                      {option.icon}
                    </span>
                    <span className={isSelected ? 'font-medium' : ''}>
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