import TaskProcessor from '@/components/TaskProcessor'
import CalendarStoreInitializer from '@/components/CalendarStoreInitializer'
import CalendarSyncInitializer from '@/components/CalendarSyncInitializer'

export default function Home() {
  return (
    <main>
      <CalendarStoreInitializer />
      <CalendarSyncInitializer />
      <TaskProcessor />
    </main>
  )
}