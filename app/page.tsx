import TaskProcessorWrapper from '@/components/TaskProcessorWrapper'
import CalendarStoreInitializer from '@/components/CalendarStoreInitializer'
import CalendarSyncInitializer from '@/components/CalendarSyncInitializer'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import { FocusedTaskProvider } from '@/contexts/FocusedTaskContext'
import { OverlayProvider } from '@/contexts/OverlayContext'
import { NewTaskProvider } from '@/contexts/NewTaskContext'

export default function Home() {
  return (
    <main>
      <SettingsProvider>
        <ThemeProvider>
          <FocusedTaskProvider>
            <OverlayProvider>
              <NewTaskProvider>
                <CalendarStoreInitializer />
                <CalendarSyncInitializer />
                <TaskProcessorWrapper />
              </NewTaskProvider>
            </OverlayProvider>
          </FocusedTaskProvider>
        </ThemeProvider>
      </SettingsProvider>
    </main>
  )
}