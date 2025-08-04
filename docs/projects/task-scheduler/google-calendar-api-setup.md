# Google Calendar API Setup Guide

This guide provides detailed, step-by-step instructions for setting up Google Calendar API access for the Task Scheduler project.

## Prerequisites

- A Google account
- A web browser
- Access to your project's codebase to set environment variables

## Step 1: Access Google Cloud Console

1. Open your web browser and navigate to: https://console.cloud.google.com/
2. Sign in with your Google account if prompted
3. If this is your first time, you may see a welcome screen - click "Get Started" or "Continue"

## Step 2: Create a New Project (or Select Existing)

### Creating a New Project:

1. Click the **project dropdown** at the top of the page (it might say "Select a project" or show an existing project name)
2. In the dialog that appears, click **"NEW PROJECT"** button in the top right
3. Fill in the project details:
   - **Project name**: `task-scheduler-api` (or your preferred name)
   - **Location**: Leave as "No organization" unless you have a Google Workspace account
4. Click **"CREATE"**
5. Wait for the project to be created (you'll see a notification)
6. Make sure your new project is selected in the dropdown

### Using an Existing Project:

1. Click the project dropdown at the top
2. Select your existing project from the list
3. Click **"OPEN"**

## Step 3: Enable Google Calendar API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
   - If you don't see the sidebar, click the hamburger menu (☰) in the top left
2. In the search bar, type **"Google Calendar API"**
3. Click on **"Google Calendar API"** from the results
4. Click the blue **"ENABLE"** button
5. Wait for the API to be enabled (the page will refresh)

## Step 4: Create API Key Credentials

1. After enabling the API, you'll be redirected to the API dashboard
2. Click **"CREATE CREDENTIALS"** button at the top
3. In the dropdown, select **"API key"**
4. A dialog will show your new API key - **COPY IT NOW** (you'll need it later)
5. Click **"RESTRICT KEY"** to secure it (important!)

## Step 5: Restrict the API Key

### Application Restrictions:

1. In the "Application restrictions" section, select **"HTTP referrers (websites)"**
2. Click **"ADD"** under "Website restrictions"
3. Add your allowed referrers:
   - For local development: `http://localhost:3000/*`
   - For production: `https://yourdomain.com/*`
   - Add more as needed
4. Click **"DONE"** after adding each referrer

### API Restrictions:

1. Scroll down to "API restrictions"
2. Select **"Restrict key"**
3. In the dropdown, search for and select **"Google Calendar API"**
4. Click **"SAVE"** at the bottom of the page

## Step 6: Test the API Key

Test your API key with a simple curl command:

```bash
curl "https://www.googleapis.com/calendar/v3/calendars/primary/events?key=YOUR_API_KEY"
```

Replace `YOUR_API_KEY` with your actual API key.

**Expected responses:**
- ✅ Success: You'll get an authentication error (401) - this is normal! It means the API key is valid but you need OAuth for user data
- ❌ Failed: "API key not valid" - check your key and restrictions

## Step 7: Set Up Environment Variables

### For Local Development:

1. In your project root, create or edit `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY=your_api_key_here
```

2. Restart your development server for changes to take effect

### For Production:

Set the environment variable in your hosting platform:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Other**: Refer to your platform's documentation

## Common Issues and Solutions

### Issue 1: "API key not valid"
- **Cause**: Key restrictions don't match your request origin
- **Solution**: 
  - Check your HTTP referrers list includes your domain
  - For localhost, use `http://localhost:3000/*` (not https)
  - Wait 5-10 minutes for restrictions to propagate

### Issue 2: "Google Calendar API has not been used in project"
- **Cause**: API not enabled for your project
- **Solution**: Go back to Step 3 and ensure the API is enabled

### Issue 3: "Referrer not allowed"
- **Cause**: Your app's domain isn't in the allowed referrers list
- **Solution**: 
  - Add your exact domain to the referrers list
  - Include wildcards: `https://yourdomain.com/*`
  - For subdomains: `https://*.yourdomain.com/*`

### Issue 4: CORS errors in browser
- **Cause**: Making direct API calls from frontend
- **Solution**: 
  - API keys with referrer restrictions work in browsers
  - Ensure you're using the correct Google Calendar API endpoints
  - Check browser console for the exact origin being used

## Security Best Practices

1. **Never commit API keys to version control**
   - Add `.env.local` to `.gitignore`
   - Use environment variables for all environments

2. **Use appropriate restrictions**
   - Always restrict by HTTP referrers for web apps
   - Add only the domains you actually use
   - Remove localhost referrers in production keys

3. **Rotate keys periodically**
   - Create new keys every 3-6 months
   - Delete old, unused keys

4. **Monitor usage**
   - Check the Google Cloud Console for unusual activity
   - Set up billing alerts even for free tier usage

## Next Steps

1. With your API key set up, you can now:
   - Fetch public calendar data
   - Display calendar information in your app
   - Note: For private calendar access, you'll need OAuth 2.0 authentication

2. Consider implementing:
   - Error handling for API failures
   - Rate limiting to stay within quotas
   - Caching to reduce API calls

## Useful Links

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Quotas and Limits](https://developers.google.com/calendar/api/guides/quota)

---

**Note**: This guide is for API key authentication, which only allows access to public calendar data. For accessing private user calendars, you'll need to implement OAuth 2.0 authentication flow.