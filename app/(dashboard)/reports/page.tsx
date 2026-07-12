'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Filter, Loader2 } from 'lucide-react'
import Link from 'next/link'

const REPORTS = [
  { key: 'environmental', label: 'Environmental', href: '/reports/environmental', color: '#10b981', desc: 'Activity logs, carbon transactions, goals' },
  { key: 'social', label: 'Social', href: '/reports/social', color: '#3b82f6', desc: 'CSR activities, participation rates' },
  { key: 'governance', label: 'Governance', href: '/reports/governance', color: '#8b5cf6', desc: 'Policies, audits, compliance issues' },
  { key: 'esg-summary', label: 'ESG Summary', href: '/reports/esg-summary', color: '#f59e0b', desc: 'Overall and department ESG scores' },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Reports</h1>
        <p className="text-sm text-gray-400 mt-1">Filtered reports with CSV export across all ESG pillars</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map(r => (
          <Link key={r.key} href={r.href} className="glass-card p-6 hover:scale-[1.01] transition-transform group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
              <h2 className="font-semibold text-white group-hover:opacity-80 transition-opacity">{r.label} Report</h2>
            </div>
            <p className="text-sm text-gray-500">{r.desc}</p>
            <div className="flex items-center gap-1.5 mt-4 text-xs" style={{ color: r.color }}>
              <Download size={12} /> Filterable · CSV Export
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
