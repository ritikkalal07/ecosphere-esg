import Link from 'next/link'
import { Leaf, Zap, Target, BarChart2, List } from 'lucide-react'

const pages = [
  { href: '/environmental/emission-factors', icon: Zap, label: 'Emission Factors', desc: 'Manage CO₂ emission factor library' },
  { href: '/environmental/activity-log', icon: List, label: 'Activity Log', desc: 'Log purchase, manufacturing, fleet, expense activities' },
  { href: '/environmental/carbon-transactions', icon: Leaf, label: 'Carbon Transactions', desc: 'View auto-calculated and manual carbon entries' },
  { href: '/environmental/goals', icon: Target, label: 'Goals', desc: 'Track sustainability targets vs actuals' },
  { href: '/environmental/dashboard', icon: BarChart2, label: 'Dashboard', desc: 'Emissions trends and department breakdown' },
]

export default function EnvironmentalPage() {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Leaf size={22} className="text-emerald-400" /> Environmental
        </h1>
        <p className="text-sm text-gray-400 mt-1">Track carbon emissions, activity logs, and sustainability goals</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href} className="glass-card p-5 hover:border-emerald-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(16,185,129,0.12)' }}>
              <Icon size={20} className="text-emerald-400" />
            </div>
            <div className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">{label}</div>
            <div className="text-xs text-gray-500 mt-1">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
