import { google, calendar_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

export interface CalendarEvent {
  id: string
  calendarId: string
  calendarName: string
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

      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client as any })
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
      // Get all accessible calendars with token refresh handling
      const calendarList = await this.callWithTokenRefresh(() => 
        this.calendar!.calendarList.list()
      )
      const calendars = calendarList.data.items || []
      
      // Limit to first 5 calendars to reduce API calls
      const limitedCalendars = calendars.slice(0, 5)
      console.log(`Fetching events from ${limitedCalendars.length} of ${calendars.length} calendars to avoid rate limits`)
      
      // Fetch events from calendars with staggered delays to avoid rate limits
      const allCalendarEvents: CalendarEvent[] = []
      
      for (let i = 0; i < limitedCalendars.length; i++) {
        const cal = limitedCalendars[i]
        
        try {
          // Add small delay between requests to avoid rate limits
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
          
          const response = await this.callWithTokenRefresh(() =>
            this.calendar!.events.list({
              calendarId: cal.id!,
              timeMin: startOfDay.toISOString(),
              timeMax: endOfDay.toISOString(),
              singleEvents: true,
              orderBy: 'startTime',
              timeZone: 'America/Los_Angeles'
            })
          )

          const calendarEvents: CalendarEvent[] = (response.data.items || []).map((event: any) => ({
            id: event.id!,
            calendarId: cal.id!,
            calendarName: cal.summary || cal.summaryOverride || 'Untitled Calendar',
            title: event.summary || 'Untitled',
            start: new Date(event.start?.dateTime || event.start?.date!),
            end: new Date(event.end?.dateTime || event.end?.date!),
            color: cal.backgroundColor ?? undefined,
            isAllDay: !event.start?.dateTime
          }))
          
          allCalendarEvents.push(...calendarEvents)
        } catch (error) {
          console.error(`Failed to fetch events for calendar ${cal.summary}:`, error)
          // Continue with other calendars even if one fails
        }
      }

      return allCalendarEvents
    } catch (error) {
      console.error('Failed to fetch events:', error)
      throw error
    }
  }

  // Helper method to handle token refresh and rate limiting on API calls
  private async callWithTokenRefresh<T>(apiCall: () => Promise<T>, retryCount = 0): Promise<T> {
    try {
      return await apiCall()
    } catch (error: any) {
      // Check if it's a rate limit error (403 with quota exceeded)
      if (error.code === 403 && error.message?.includes('Quota exceeded')) {
        console.log(`Rate limit hit, attempt ${retryCount + 1}`)
        
        if (retryCount < 3) {
          // Exponential backoff: 2^retryCount seconds
          const delay = Math.pow(2, retryCount) * 1000
          console.log(`Waiting ${delay}ms before retry...`)
          
          await new Promise(resolve => setTimeout(resolve, delay))
          return await this.callWithTokenRefresh(apiCall, retryCount + 1)
        } else {
          throw new Error('Calendar API rate limit exceeded. Please try again in a minute.')
        }
      }
      
      // Check if it's an auth error (401 or token expired)
      if (error.code === 401 || error.message?.includes('invalid_grant') || error.message?.includes('Token has been expired')) {
        console.log('Token expired, attempting refresh...')
        
        try {
          // Refresh the token
          const { credentials } = await this.oauth2Client.refreshAccessToken()
          
          // Save refreshed tokens
          const tokenPath = path.join(process.cwd(), 'credentials', 'google-oauth-tokens.json')
          await writeFile(tokenPath, JSON.stringify(credentials, null, 2))
          
          // Update credentials
          this.oauth2Client.setCredentials(credentials)
          
          console.log('Token refreshed successfully, retrying API call...')
          
          // Retry the API call
          return await apiCall()
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError)
          throw new Error('Authentication expired. Please re-authorize.')
        }
      }
      
      throw error
    }
  }

  isAuthorized(): boolean {
    if (!this.calendar) return false
    
    const credentials = this.oauth2Client.credentials
    if (!credentials.access_token) return false
    
    // Check if access token is expired
    if (credentials.expiry_date && credentials.expiry_date < Date.now()) {
      // If we have a refresh token, we can still be considered authorized
      return !!credentials.refresh_token
    }
    
    return true
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