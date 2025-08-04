import { google, calendar_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

export interface CalendarEvent {
  id: string
  calendarId: string
  title: string
  start: Date
  end: Date
  color?: string
  isAllDay: boolean
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client
  private calendar: calendar_v3.Calendar | null = null

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
  }

  async initialize(): Promise<boolean> {
    try {
      // Try to load OAuth tokens first
      const tokenPath = path.join(process.cwd(), 'credentials', 'google-oauth-tokens.json')
      const tokens = JSON.parse(await readFile(tokenPath, 'utf-8'))
      
      this.oauth2Client.setCredentials(tokens)
      
      // Check if token needs refresh
      if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
        const { credentials } = await this.oauth2Client.refreshAccessToken()
        await writeFile(tokenPath, JSON.stringify(credentials, null, 2))
        this.oauth2Client.setCredentials(credentials)
      }

      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
      return true
    } catch (error) {
      console.error('Failed to initialize with OAuth, falling back to service account:', error)
      
      // Fallback to service account
      try {
        const auth = new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
          scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        })
        
        this.calendar = google.calendar({ version: 'v3', auth })
        return true
      } catch (serviceError) {
        console.error('Failed to initialize with service account:', serviceError)
        return false
      }
    }
  }

  async getEvents(date: Date): Promise<CalendarEvent[]> {
    if (!this.calendar) {
      throw new Error('Calendar service not initialized')
    }

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    try {
      // Get all accessible calendars
      const calendarList = await this.calendar.calendarList.list()
      const calendars = calendarList.data.items || []
      
      // Fetch events from all calendars
      const eventPromises = calendars.map(async (cal) => {
        try {
          const response = await this.calendar!.events.list({
            calendarId: cal.id!,
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            timeZone: 'America/Los_Angeles'
          })

          return (response.data.items || []).map(event => ({
            id: event.id!,
            calendarId: cal.id!,
            title: event.summary || 'Untitled',
            start: new Date(event.start?.dateTime || event.start?.date!),
            end: new Date(event.end?.dateTime || event.end?.date!),
            color: cal.backgroundColor,
            isAllDay: !event.start?.dateTime
          }))
        } catch (error) {
          console.error(`Failed to fetch events for calendar ${cal.summary}:`, error)
          return []
        }
      })

      const allEvents = await Promise.all(eventPromises)
      return allEvents.flat()
    } catch (error) {
      console.error('Failed to fetch events:', error)
      throw error
    }
  }

  isAuthorized(): boolean {
    return !!this.calendar
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly'
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    })
  }
}

// Singleton instance
let calendarService: GoogleCalendarService | null = null

export async function getCalendarService(): Promise<GoogleCalendarService> {
  if (!calendarService) {
    calendarService = new GoogleCalendarService()
    await calendarService.initialize()
  }
  return calendarService
}