import TaskProcessor from '@/components/TaskProcessor'
import CalendarStoreInitializer from '@/components/CalendarStoreInitializer'
import CalendarSyncInitializer from '@/components/CalendarSyncInitializer'
import { SettingsProvider } from '@/contexts/SettingsContext'

export default function Home() {
  return (
    <main>
      <SettingsProvider>
        <CalendarStoreInitializer />
        <CalendarSyncInitializer />
        <TaskProcessor />
      </SettingsProvider>
    </main>
  )
}