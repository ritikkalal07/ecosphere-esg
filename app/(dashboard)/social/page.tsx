import Link from 'next/link'
import { Users, ListChecks, LayoutDashboard } from 'lucide-react'

const pages = [
  { href: '/social/csr-activities', icon: ListChecks, label: 'CSR Activities', desc: 'Admin/manager: manage community & social activities' },
  { href: '/social/participation', icon: Users, label: 'Participation', desc: 'Employee: join activities and upload proof; Manager: approve/reject' },
  { href: '/social/dashboard', icon: LayoutDashboard, label: 'Dashboard', desc: 'Participation rates, diversity summary, policy acknowledgements' },
]

export default function SocialPage() {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Users size={22} className="text-blue-400" /> Social
        </h1>
        <p className="text-sm text-gray-400 mt-1">CSR activities, employee participation, and social engagement metrics</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href} className="glass-card p-5 hover:border-blue-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(59,130,246,0.12)' }}>
              <Icon size={20} className="text-blue-400" />
            </div>
            <div className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">{label}</div>
            <div className="text-xs text-gray-500 mt-1">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
