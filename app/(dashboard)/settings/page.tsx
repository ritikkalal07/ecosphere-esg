import Link from 'next/link'
import { Building2, Tags, SlidersHorizontal, Bell } from 'lucide-react'

const pages = [
  { href: '/settings/departments', icon: Building2, label: 'Departments', desc: 'CRUD with parent department hierarchy' },
  { href: '/settings/categories', icon: Tags, label: 'Categories', desc: 'Manage CSR activity and challenge categories' },
  { href: '/settings/esg-config', icon: SlidersHorizontal, label: 'ESG Configuration', desc: 'Weight sliders (must sum to 100%) + behavior toggles' },
  { href: '/settings/notifications', icon: Bell, label: 'Notifications', desc: 'Configure which notification types are active' },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Platform configuration, departments, categories, and ESG weighting</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pages.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href} className="glass-card p-5 hover:border-gray-600/50 transition-all group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Icon size={20} className="text-gray-300" />
            </div>
            <div className="font-semibold text-white text-sm group-hover:text-gray-200 transition-colors">{label}</div>
            <div className="text-xs text-gray-500 mt-1">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
