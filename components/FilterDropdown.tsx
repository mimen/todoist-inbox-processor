'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TodoistTask } from '@/lib/types';

export interface TodoistFilter {
  id: string;
  name: string;
  query: string;
  color?: string;
  is_favorite?: boolean;
}

interface FilterDropdownProps {
  selectedFilter: string;
  onFilterChange: (filterId: string, displayName: string, query: string) => void;
  allTasks: TodoistTask[];
  filters: TodoistFilter[];
}

const FilterDropdown = forwardRef<any, FilterDropdownProps>(({
  selectedFilter,
  onFilterChange,
  allTasks,
  filters
}: FilterDropdownProps, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Expose openDropdown method via ref
  useImperativeHandle(ref, () => ({
    openDropdown: () => {
      setIsOpen(true);
    }
  }));

  // Get current filter display
  const currentFilter = filters.find(f => f.id === selectedFilter);

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

  const handleSelect = (filter: TodoistFilter) => {
    onFilterChange(filter.id, filter.name, filter.query);
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
          <span>✨</span>
          <span className="font-medium text-gray-900">
            {currentFilter ? currentFilter.name : 'Select filter...'}
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
            {filters.length === 0 ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                No saved filters found
              </div>
            ) : (
              filters.map((filter) => {
                const isSelected = selectedFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    onClick={() => handleSelect(filter)}
                    className={`
                      w-full p-3 text-left hover:bg-gray-50 transition-colors
                      flex items-center justify-between
                      ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {filter.is_favorite && <span>⭐</span>}
                      <span className={isSelected ? 'font-medium' : ''}>
                        {filter.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 max-w-xs truncate">
                      {filter.query}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
})

FilterDropdown.displayName = 'FilterDropdown';

export default FilterDropdown;