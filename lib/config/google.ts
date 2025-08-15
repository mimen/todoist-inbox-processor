export const googleConfig = {
  oauth: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },
  serviceAccount: {
    keyPath: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
  },
  calendar: {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  },
} as const