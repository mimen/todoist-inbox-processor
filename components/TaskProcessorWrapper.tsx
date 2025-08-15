'use client'

import dynamic from 'next/dynamic'

const TaskProcessor = dynamic(
  () => import('./TaskProcessor'),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-screen">Loading...</div>
  }
)

export default function TaskProcessorWrapper() {
  return <TaskProcessor />
}