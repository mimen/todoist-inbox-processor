/**
 * Settings type definitions for the todoist-inbox-processor app
 */

export interface ListViewSettings {
  multiListMode: boolean
  duplicateFiltering: boolean
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface GeneralSettings {
  theme: ThemePreference
}

export interface AppSettings {
  general: GeneralSettings
  listView: ListViewSettings
}

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    theme: 'system'
  },
  listView: {
    multiListMode: false,
    duplicateFiltering: false
  }
}