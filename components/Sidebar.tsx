'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Leaf, Users, Shield, Trophy, BarChart3,
  Settings, Home, ChevronRight, Zap
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

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-30"
      style={{
        width: 'var(--sidebar-width)',
        background: 'rgba(15,17,23,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
        >
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-white text-sm tracking-wide">EcoSphere</div>
          <div className="text-[10px] text-emerald-400 font-medium uppercase tracking-widest">ESG Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              {group.label}
            </div>
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 group transition-all"
                  style={{
                    background: active ? 'rgba(16,185,129,0.12)' : 'transparent',
                    color: active ? '#10b981' : '#9ca3af',
                  }}
                >
                  <item.icon
                    size={16}
                    className="shrink-0 transition-colors"
                    style={{ color: active ? '#10b981' : '#6b7280' }}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                  {active && (
                    <ChevronRight size={14} className="ml-auto text-emerald-400" />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/5 text-center">
        <div className="text-[10px] text-gray-600">EcoSphere v1.0 · Hackathon Build</div>
      </div>
    </aside>
  )
}
