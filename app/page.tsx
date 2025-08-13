import TaskProcessor from '@/components/TaskProcessor'
import CalendarStoreInitializer from '@/components/CalendarStoreInitializer'
import CalendarSyncInitializer from '@/components/CalendarSyncInitializer'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import { FocusedTaskProvider } from '@/contexts/FocusedTaskContext'
import { OverlayProvider } from '@/contexts/OverlayContext'

export default function Home() {
  return (
    <main>
      <SettingsProvider>
        <ThemeProvider>
          <FocusedTaskProvider>
            <OverlayProvider>
              <CalendarStoreInitializer />
              <CalendarSyncInitializer />
              <TaskProcessor />
            </OverlayProvider>
          </FocusedTaskProvider>
        </ThemeProvider>
      </SettingsProvider>
    </main>
  )
}