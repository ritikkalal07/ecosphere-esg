import { createBrowserClient } from '@supabase/ssr'

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
  if (typeof window !== 'undefined' && (window as any).__SUPABASE_URL__) {
    return (window as any).__SUPABASE_URL__
  }
  const url = findEnvVar('SUPABASE_URL')
  return url && url.startsWith('http') ? url : fallbackUrl
}

function getEnvKey() {
  if (typeof window !== 'undefined' && (window as any).__SUPABASE_ANON_KEY__) {
    return (window as any).__SUPABASE_ANON_KEY__
  }
  const key = findEnvVar('SUPABASE_ANON_KEY')
  return key && key.length > 20 ? key : fallbackKey
}

export function createClient() {
  return createBrowserClient(getEnvUrl(), getEnvKey())
}
