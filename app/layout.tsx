import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EcoSphere — ESG Management Platform',
  description: 'Track, measure, and improve your organization\'s Environmental, Social, and Governance performance with gamification.',
}

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabaseUrl = findEnvVar('SUPABASE_URL') || ''
  const supabaseAnonKey = findEnvVar('SUPABASE_ANON_KEY') || ''

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__SUPABASE_URL__ = ${JSON.stringify(supabaseUrl)};
              window.__SUPABASE_ANON_KEY__ = ${JSON.stringify(supabaseAnonKey)};
            `,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
