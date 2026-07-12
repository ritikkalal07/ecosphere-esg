import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const fallbackUrl = 'https://placeholder-url-for-build.supabase.co'
const fallbackKey = 'placeholder-key'

function getEnvUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return url && url.startsWith('http') ? url : fallbackUrl
}

function getEnvKey(anon = true) {
  const key = anon ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : process.env.SUPABASE_SERVICE_ROLE_KEY
  return key && key.length > 20 ? key : fallbackKey
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getEnvUrl(),
    getEnvKey(true),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies set in middleware
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getEnvUrl(),
    getEnvKey(false),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
