import Link from 'next/link'
import { Shield, ScrollText, CheckSquare, ClipboardList, AlertTriangle } from 'lucide-react'

const pages = [
  { href: '/governance/policies', icon: ScrollText, label: 'Policies', desc: 'Admin: create and version ESG policies' },
  { href: '/governance/acknowledgements', icon: CheckSquare, label: 'Acknowledgements', desc: 'Employee: acknowledge policies; Admin: view stats' },
  { href: '/governance/audits', icon: ClipboardList, label: 'Audits', desc: 'Admin/manager: manage audit records and findings' },
  { href: '/governance/compliance-issues', icon: AlertTriangle, label: 'Compliance Issues', desc: 'Linked to audits; overdue issues flagged automatically' },
]

export default function GovernancePage() {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield size={22} className="text-violet-400" /> Governance
        </h1>
        <p className="text-sm text-gray-400 mt-1">Policies, audits, compliance tracking with automatic overdue detection</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {pages.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href} className="glass-card p-5 hover:border-violet-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(139,92,246,0.12)' }}>
              <Icon size={20} className="text-violet-400" />
            </div>
            <div className="font-semibold text-white text-sm group-hover:text-violet-400 transition-colors">{label}</div>
            <div className="text-xs text-gray-500 mt-1">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
