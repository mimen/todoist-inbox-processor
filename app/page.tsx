import TaskProcessor from '@/components/TaskProcessor'
import CalendarStoreInitializer from '@/components/CalendarStoreInitializer'
import CalendarSyncInitializer from '@/components/CalendarSyncInitializer'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function Home() {
  return (
    <main>
      <SettingsProvider>
        <ThemeProvider>
          <CalendarStoreInitializer />
          <CalendarSyncInitializer />
          <TaskProcessor />
        </ThemeProvider>
      </SettingsProvider>
    </main>
  )
}