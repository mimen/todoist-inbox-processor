'use client'

import React, { useCallback } from 'react'
import { useSettingsContext } from '@/contexts/SettingsContext'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, toggleSetting } = useSettingsContext()

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 id="settings-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* List View Settings Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              List View Settings
            </h3>
            
            {/* Multi-List Mode Toggle */}
            <div className="flex items-center justify-between py-3">
              <div className="flex-1">
                <label
                  htmlFor="multi-list-mode"
                  className="text-gray-900 dark:text-gray-100 font-medium cursor-pointer"
                >
                  Multi-List Mode
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Display multiple queues simultaneously in list view (only available in Queue mode)
                </p>
              </div>
              <button
                id="multi-list-mode"
                type="button"
                role="switch"
                aria-checked={settings.listView.multiListMode}
                onClick={() => toggleSetting('listView', 'multiListMode')}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.listView.multiListMode 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <span className="sr-only">Toggle multi-list mode</span>
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.listView.multiListMode ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Duplicate Filtering Toggle */}
            <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex-1">
                <label
                  htmlFor="duplicate-filtering"
                  className="text-gray-900 dark:text-gray-100 font-medium cursor-pointer"
                >
                  Filter Duplicate Tasks
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Show each task only once across all lists (in the first list it appears)
                </p>
              </div>
              <button
                id="duplicate-filtering"
                type="button"
                role="switch"
                aria-checked={settings.listView.duplicateFiltering}
                onClick={() => toggleSetting('listView', 'duplicateFiltering')}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.listView.duplicateFiltering 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <span className="sr-only">Toggle duplicate filtering</span>
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.listView.duplicateFiltering ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Future Settings Sections */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              More settings coming soon...
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                     rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}