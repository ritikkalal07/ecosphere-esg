import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EcoSphere — ESG Management Platform',
  description: 'Track, measure, and improve your organization\'s Environmental, Social, and Governance performance with gamification.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
