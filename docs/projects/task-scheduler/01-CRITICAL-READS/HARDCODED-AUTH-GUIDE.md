# Hardcoded Authentication Guide

## Quick Setup for Google Calendar Access

This guide explains how to implement hardcoded Google Calendar access for the MVP, similar to how Todoist API is currently handled.

## Required Setup

### 1. Google Cloud Console Setup
1. Create a new project or use existing
2. Enable Google Calendar API
3. Create credentials → API Key
4. Restrict API key to:
   - Google Calendar API only
   - Your application's domain/localhost

### 2. Environment Variables
Create these environment variables:

```bash
# .env.local
GOOGLE_CALENDAR_API_KEY=AIza...your-api-key
GOOGLE_CALENDAR_IDS=primary,work@company.com,personal@gmail.com
```

### 3. Calendar Access Pattern

```typescript
// Similar to how Todoist is handled
const calendarConfig = {
  apiKey: process.env.GOOGLE_CALENDAR_API_KEY!,
  calendarIds: process.env.GOOGLE_CALENDAR_IDS!.split(',')
}

// Direct API usage
const calendar = google.calendar({
  version: 'v3',
  auth: process.env.GOOGLE_CALENDAR_API_KEY
})
```

## Implementation Pattern

### API Route Structure
```typescript
// app/api/calendar/events/route.ts
export async function GET(request: Request) {
  // No OAuth flow needed
  const events = await fetchEventsWithApiKey()
  return NextResponse.json(events)
}
```

### Service Layer
```typescript
// lib/calendar-service.ts
class CalendarService {
  private apiKey = process.env.GOOGLE_CALENDAR_API_KEY!
  private calendarIds = process.env.GOOGLE_CALENDAR_IDS!.split(',')
  
  async fetchEvents(date: Date) {
    // Direct API calls with API key
    // No token refresh needed
  }
}
```

## Security Considerations

### API Key Restrictions
1. **Domain Restriction**: Restrict to your domain
2. **API Restriction**: Only Google Calendar API
3. **IP Restriction**: Optional for production

### What This Allows
- ✅ Read public calendar events
- ✅ Read events from calendars shared with service account
- ✅ No user authentication needed
- ✅ Works immediately

### What This Doesn't Allow
- ❌ Access to private calendars without sharing
- ❌ Creating/updating events
- ❌ User-specific calendar access
- ❌ Multiple user support

## Common Issues

### "Calendar not found" Error
**Solution**: Make sure calendars are either:
- Public
- Shared with the service account
- Listed in GOOGLE_CALENDAR_IDS

### "API Key Invalid" Error
**Solution**: Check:
- API key is correct
- Google Calendar API is enabled
- Key restrictions match your domain

### No Events Showing
**Solution**: Verify:
- Calendar IDs are correct
- Events exist in date range
- Timezone is PST

## Migration Path to OAuth

When ready to support multiple users:

```typescript
// Future OAuth implementation
// 1. Keep hardcoded as fallback
// 2. Add OAuth flow for user-specific access
// 3. Gradually migrate users

const calendarAccess = user.hasOAuth 
  ? getUserCalendarAccess(user)
  : getHardcodedAccess()
```

## Example Implementation

```typescript
// Complete example matching Todoist pattern
import { google } from 'googleapis'

export class HardcodedCalendarService {
  private calendar = google.calendar({
    version: 'v3',
    auth: process.env.GOOGLE_CALENDAR_API_KEY
  })
  
  async getEvents(date: Date): Promise<CalendarEvent[]> {
    const calendarIds = process.env.GOOGLE_CALENDAR_IDS!.split(',')
    
    const promises = calendarIds.map(calendarId =>
      this.calendar.events.list({
        calendarId,
        timeMin: startOfDay(date).toISOString(),
        timeMax: endOfDay(date).toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'America/Los_Angeles'
      })
    )
    
    const results = await Promise.all(promises)
    
    // Transform and combine results
    return results.flatMap((result, index) => 
      result.data.items?.map(event => ({
        id: event.id!,
        calendarId: calendarIds[index],
        title: event.summary || '',
        start: new Date(event.start?.dateTime || event.start?.date!),
        end: new Date(event.end?.dateTime || event.end?.date!),
        color: '#' + (index * 123456).toString(16).padStart(6, '0'),
        isAllDay: !event.start?.dateTime
      })) || []
    )
  }
}
```

## Testing the Setup

1. Set environment variables
2. Test API key with curl:
```bash
curl "https://www.googleapis.com/calendar/v3/calendars/primary/events?key=YOUR_API_KEY"
```
3. If you get events JSON, it's working
4. If you get an error, check restrictions

## Summary

This approach mirrors the current Todoist implementation:
- No complex auth flows
- Works immediately
- Good enough for single-user MVP
- Easy to migrate later

Focus on building the UI first, worry about multi-user OAuth later.