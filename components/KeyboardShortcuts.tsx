'use client'

interface KeyboardShortcutsProps {
  onClose: () => void
}

interface ShortcutItem {
  key: string | string[]
  description: string
}

export default function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  const shortcuts = [
    { category: 'Navigation', items: [
      { key: ['j', '→'], description: 'Browse next task (wraps around)' },
      { key: ['k', '←'], description: 'Browse previous task (wraps around)' },
      { key: '?', description: 'Show/hide keyboard shortcuts' },
      { key: ['Esc', '`'], description: 'Close any open dialog' },
    ]},
    { category: 'Queue Management (Empty State)', items: [
      { key: ['→', 'Enter'], description: 'Continue to next queue' },
      { key: 'r', description: 'Refresh current queue' },
    ]},
    { category: 'Processing Mode', items: [
      { key: '1-9', description: 'Quick switch to processing modes (based on order)' },
    ]},
    { category: 'Task Management', items: [
      { key: 'p', description: 'Change task priority' },
      { key: '#', description: 'Move to different project' },
      { key: '@', description: 'Add or remove labels' },
      { key: '+', description: 'Assign task to someone (if collaborators exist)' },
      { key: 's', description: 'Schedule when to work on task' },
      { key: 'd', description: 'Set task deadline' },
      { key: 'e', description: 'Mark task as processed' },
      { key: 'c', description: 'Complete task' },
    ]},
    { category: 'Selection Dialogs', items: [
      { key: ['1', '2', '3', '4'], description: 'Set priority directly (P1-P4)' },
      { key: ['↑', '↓'], description: 'Navigate through options' },
      { key: 'Enter', description: 'Select highlighted option' },
      { key: 'Type', description: 'Filter options or enter custom date' },
      { key: ['Shift+Delete', 'Shift+Backspace'], description: 'Clear/reset field value' },
    ]},
    { category: 'Confirmation Dialogs', items: [
      { key: 'Enter', description: 'Confirm action (complete/archive)' },
      { key: 'Esc', description: 'Cancel action' },
    ]},
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {shortcuts.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-sm font-medium text-gray-900 mb-2">{section.category}</h3>
              <div className="space-y-2">
                {section.items.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {Array.isArray(shortcut.key) ? (
                        shortcut.key.map((key, keyIndex) => (
                          <div key={keyIndex} className="flex items-center">
                            <span className="kbd">{key}</span>
                            {keyIndex < shortcut.key.length - 1 && (
                              <span className="mx-1 text-gray-400">/</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="kbd">{shortcut.key}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Press <span className="kbd">?</span> anytime to toggle this help
          </p>
        </div>
      </div>
    </div>
  )
}