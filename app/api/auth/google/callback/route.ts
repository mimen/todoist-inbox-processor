import { OAuth2Client } from 'google-auth-library'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.json({ error }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 })
  }

  try {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const { tokens } = await oauth2Client.getToken(code)
    
    console.log('OAuth tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope
    })
    
    // For MVP, store tokens in a local file (in production, use a database)
    const tokenPath = path.join(process.cwd(), 'credentials', 'google-oauth-tokens.json')
    await writeFile(tokenPath, JSON.stringify(tokens, null, 2))

    // Redirect back to the main app with success indicator
    return NextResponse.redirect(new URL('/?auth=success', request.url))
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.json({ 
      error: 'Failed to exchange authorization code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}