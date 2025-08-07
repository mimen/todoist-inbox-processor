/**
 * Settings type definitions for the todoist-inbox-processor app
 */

export interface ListViewSettings {
  multiListMode: boolean
  duplicateFiltering: boolean
}

export interface AppSettings {
  listView: ListViewSettings
}

export const DEFAULT_SETTINGS: AppSettings = {
  listView: {
    multiListMode: false,
    duplicateFiltering: false
  }
}