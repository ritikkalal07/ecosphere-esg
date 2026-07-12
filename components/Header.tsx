'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NotificationBell from './NotificationBell'
import { LogOut, User, Menu } from 'lucide-react'

const breadcrumbs: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/environmental': 'Environmental',
  '/social': 'Social',
  '/governance': 'Governance',
  '/gamification': 'Gamification',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
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
      className="flex items-center justify-between px-4 md:px-6 py-4 sticky top-0 z-20"
      style={{
        background: 'rgba(248, 250, 252, 0.95)',
        borderBottom: '1px solid var(--border-card)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center">
        {onMenuClick && (
          <button 
            id="mobile-menu-toggle"
            onClick={onMenuClick} 
            className="md:hidden mr-3 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <div>
          <h1 className="text-base font-semibold text-slate-900">
            {section?.[1] ?? 'EcoSphere'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Dynamic Role Indicator Badge */}
        {profile?.role && (
          <span className="status-badge" style={{
            background: profile.role === 'admin' ? 'rgba(79, 70, 229, 0.1)' : profile.role === 'manager' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: profile.role === 'admin' ? 'var(--color-primary)' : profile.role === 'manager' ? 'var(--color-success)' : 'var(--color-warning)',
            border: `1px solid ${profile.role === 'admin' ? 'rgba(79, 70, 229, 0.2)' : profile.role === 'manager' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
          }}>
            {profile.role === 'admin' ? '⚙️ System Admin' : profile.role === 'manager' ? '📈 ESG Manager' : '👤 Employee Panel'}
          </span>
        )}

        <NotificationBell />

        {/* User chip */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: '#ffffff', border: '1px solid var(--border-card)' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, var(--color-success), var(--color-primary))' }}
          >
            <User size={14} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-slate-900 leading-none">{profile?.full_name ?? '...'}</div>
            <div className="text-[10px] text-slate-500 capitalize mt-0.5">{profile?.role ?? ''}</div>
          </div>
        </div>

        <button
          id="logout-btn"
          onClick={handleLogout}
          title="Logout"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
          style={{ background: '#ffffff', border: '1px solid var(--border-card)' }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  )
}
