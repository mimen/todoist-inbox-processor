import TaskProcessor from '@/components/TaskProcessor'
import SyncStatus from '@/components/SyncStatus'
import CalendarStoreInitializer from '@/components/CalendarStoreInitializer'

export default function Home() {
  return (
    <main>
      <CalendarStoreInitializer />
      <div className="fixed top-0 right-0 z-30">
        <SyncStatus />
      </div>
      <TaskProcessor />
    </main>
  )
}