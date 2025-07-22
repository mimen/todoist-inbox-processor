import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from './lib/logger'

export function middleware(request: NextRequest) {
  // Log API requests only
  if (request.nextUrl.pathname.startsWith('/api')) {
    logger.request(request.method, request.nextUrl.pathname)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}