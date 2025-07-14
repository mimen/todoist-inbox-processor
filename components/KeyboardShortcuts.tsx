'use client'

interface KeyboardShortcutsProps {
  onClose: () => void
}

export default function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  const shortcuts = [
    { category: 'Navigation', items: [
      { key: 'j / Enter / →', description: 'Next task' },
      { key: 'k / ←', description: 'Previous task' },
      { key: '?', description: 'Toggle this help' },
      { key: 'Esc', description: 'Close overlays/help' },
    ]},
    { category: 'Task Management', items: [
      { key: 'p', description: 'Set priority' },
      { key: '#', description: 'Change project' },
      { key: '@', description: 'Add/remove labels' },
      { key: 's', description: 'Set scheduled date' },
      { key: 'd', description: 'Set deadline' },
      { key: 'e', description: 'Archive task (with confirmation)' },
      { key: 'c', description: 'Complete task (with confirmation)' },
    ]},
    { category: 'Quick Actions', items: [
      { key: '1-4', description: 'Quick priority (when priority overlay open)' },
      { key: '↑↓', description: 'Navigate in overlays' },
      { key: 'Enter', description: 'Select in overlays' },
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
                    <span className="kbd">{shortcut.key}</span>
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