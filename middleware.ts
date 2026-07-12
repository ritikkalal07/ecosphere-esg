import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const fallbackUrl = 'https://placeholder-url-for-build.supabase.co'
const fallbackKey = 'placeholder-key'

function findEnvVar(suffix: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined
  if (process.env[suffix]) return process.env[suffix]
  const publicDirect = `NEXT_PUBLIC_${suffix}`
  if (process.env[publicDirect]) return process.env[publicDirect]
  
  const matchingKey = Object.keys(process.env).find(key => 
    key.endsWith(suffix) && process.env[key]
  )
  return matchingKey ? process.env[matchingKey] : undefined
}

function getEnvUrl() {
  const url = findEnvVar('SUPABASE_URL')
  return url && url.startsWith('http') ? url : fallbackUrl
}

function getEnvKey() {
  const key = findEnvVar('SUPABASE_ANON_KEY')
  return key && key.length > 20 ? key : fallbackKey
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    getEnvUrl(),
    getEnvKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/environmental') ||
      request.nextUrl.pathname.startsWith('/social') ||
      request.nextUrl.pathname.startsWith('/governance') ||
      request.nextUrl.pathname.startsWith('/gamification') ||
      request.nextUrl.pathname.startsWith('/reports') ||
      request.nextUrl.pathname.startsWith('/settings')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Redirect to dashboard if logged-in user visits login
  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
