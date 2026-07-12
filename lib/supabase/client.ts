import { createBrowserClient } from '@supabase/ssr'

const fallbackUrl = 'https://placeholder-url-for-build.supabase.co'
const fallbackKey = 'placeholder-key'

function getEnvUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return url && url.startsWith('http') ? url : fallbackUrl
}

function getEnvKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return key && key.length > 20 ? key : fallbackKey
}

export function createClient() {
  return createBrowserClient(getEnvUrl(), getEnvKey())
}
