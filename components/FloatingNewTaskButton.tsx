'use client'

import { Plus } from 'lucide-react'
import { useNewTaskContext } from '@/contexts/NewTaskContext'

export default function FloatingNewTaskButton() {
  const { openNewTask } = useNewTaskContext()

  return (
    <button
      onClick={openNewTask}
      className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group z-40 border-2 border-blue-600"
      aria-label="Create new task"
      title="Create new task (N)"
    >
      <Plus className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" strokeWidth={2.5} />
    </button>
  )
}