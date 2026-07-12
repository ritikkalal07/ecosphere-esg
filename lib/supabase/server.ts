import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

function getEnvKey(anon = true) {
  const key = anon ? findEnvVar('SUPABASE_ANON_KEY') : findEnvVar('SUPABASE_SERVICE_ROLE_KEY')
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
