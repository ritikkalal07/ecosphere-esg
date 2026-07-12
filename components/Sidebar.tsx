'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Leaf, Users, Shield, Trophy, BarChart3,
  Settings, Home, ChevronRight, Zap, X
} from 'lucide-react'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', icon: Home, label: 'Dashboard' },
    ],
  },
  {
    label: 'ESG Pillars',
    items: [
      { href: '/environmental', icon: Leaf, label: 'Environmental' },
      { href: '/social', icon: Users, label: 'Social' },
      { href: '/governance', icon: Shield, label: 'Governance' },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { href: '/gamification', icon: Trophy, label: 'Gamification' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/reports', icon: BarChart3, label: 'Reports' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

interface SidebarProps {
  mobileOpen?: boolean
  setMobileOpen?: (open: boolean) => void
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{
        width: 'var(--sidebar-width)',
        background: '#ffffff',
        borderRight: '1px solid var(--border-card)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border-card)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--color-success), var(--color-primary))' }}
          >
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm tracking-wide">EcoSphere</div>
            <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-widest">ESG Platform</div>
          </div>
        </div>
        {/* Close button on mobile */}
        {setMobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {group.label}
            </div>
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen?.(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 group transition-all"
                  style={{
                    background: active ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                    color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <item.icon
                    size={16}
                    className="shrink-0 transition-colors"
                    style={{ color: active ? 'var(--color-primary)' : 'var(--text-muted)' }}
                  />
                  <span className="text-sm font-semibold">{item.label}</span>
                  {active && (
                    <ChevronRight size={14} className="ml-auto text-indigo-600" />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 text-center" style={{ borderTop: '1px solid var(--border-card)' }}>
        <div className="text-[10px] text-slate-400 font-medium">EcoSphere v1.0 · Odoo Hackathon</div>
      </div>
    </aside>
  )
}
