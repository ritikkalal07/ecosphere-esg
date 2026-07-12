'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Filter } from 'lucide-react'

export default function CarbonTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ dept: '', from: '', to: '', source: '' })
  const supabase = createClient()

  async function load() {
    setLoading(true)
    let q = supabase.from('carbon_transactions')
      .select('*, departments(name), emission_factors(activity_type,unit), activity_logs(type)')
      .order('date', { ascending: false }).limit(100)

    if (filters.dept) q = q.eq('department_id', filters.dept)
    if (filters.from) q = q.gte('date', filters.from)
    if (filters.to) q = q.lte('date', filters.to)
    if (filters.source) q = q.eq('source', filters.source)

    const { data } = await q
    setTransactions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.from('departments').select('id,name').then(({ data }) => setDepartments(data || []))
    load()
  }, [])

  const total = transactions.reduce((s, t) => s + (t.calculated_co2 || 0), 0)

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Carbon Transactions</h1>
          <p className="text-xs text-gray-500 mt-0.5">Total shown: <strong className="text-emerald-400">{total.toFixed(2)} kg CO₂e</strong></p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-end">
        <Filter size={15} className="text-gray-400 self-center" />
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Department</label>
          <select className="form-input text-xs py-1.5" style={{ width: 160 }}
            value={filters.dept} onChange={e => setFilters(f => ({ ...f, dept: e.target.value }))}>
            <option value="">All</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">From</label>
          <input type="date" className="form-input text-xs py-1.5" style={{ width: 140 }}
            value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">To</label>
          <input type="date" className="form-input text-xs py-1.5" style={{ width: 140 }}
            value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Source</label>
          <select className="form-input text-xs py-1.5" style={{ width: 120 }}
            value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
            <option value="">All</option>
            <option value="auto">Auto</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <button onClick={load} className="btn-primary flex items-center gap-2" style={{ padding: '8px 16px' }}>Apply</button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-emerald-400" /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Date', 'Department', 'Activity', 'CO₂e (kg)', 'Source'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-t border-white/5 table-row-hover">
                  <td className="px-4 py-3 text-xs text-gray-400">{t.date}</td>
                  <td className="px-4 py-3 text-sm text-white">{t.departments?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{t.activity_logs?.type ?? t.emission_factors?.activity_type ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: '#10b981' }}>{Number(t.calculated_co2).toFixed(4)}</td>
                  <td className="px-4 py-3">
                    <span className="status-badge" style={{
                      background: t.source === 'auto' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)',
                      color: t.source === 'auto' ? '#60a5fa' : '#f59e0b'
                    }}>{t.source}</span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm">No carbon transactions found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
