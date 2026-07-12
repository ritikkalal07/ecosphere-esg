'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NotificationBell from './NotificationBell'
import { LogOut, User } from 'lucide-react'

const breadcrumbs: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/environmental': 'Environmental',
  '/social': 'Social',
  '/governance': 'Governance',
  '/gamification': 'Gamification',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

export default function Header() {
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()
      setProfile(data)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const section = Object.entries(breadcrumbs).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )

  return (
    <header
      className="flex items-center justify-between px-6 py-4 sticky top-0 z-20"
      style={{
        background: 'rgba(15,17,23,0.9)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Breadcrumb */}
      <div>
        <h1 className="text-base font-semibold text-white">
          {section?.[1] ?? 'EcoSphere'}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        {/* User chip */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
          >
            <User size={14} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-white leading-none">{profile?.full_name ?? '...'}</div>
            <div className="text-[10px] text-gray-500 capitalize mt-0.5">{profile?.role ?? ''}</div>
          </div>
        </div>

        <button
          id="logout-btn"
          onClick={handleLogout}
          title="Logout"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  )
}
