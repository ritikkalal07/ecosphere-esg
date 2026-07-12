'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Download, Filter } from 'lucide-react'

function exportCSV(data: any[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const csv = `${headers}\n${rows}`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function EnvironmentalReport() {
  const [data, setData] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ dept: '', from: '', to: '' })
  const supabase = createClient()

  async function load() {
    setLoading(true)
    let q = supabase.from('carbon_transactions')
      .select('date, calculated_co2, source, departments(name), activity_logs(type, quantity, unit)')
      .order('date', { ascending: false }).limit(500)
    if (filters.dept) q = q.eq('department_id', filters.dept)
    if (filters.from) q = q.gte('date', filters.from)
    if (filters.to) q = q.lte('date', filters.to)
    const { data: rows } = await q
    setData((rows || []).map((r: any) => ({
      date: r.date,
      department: r.departments?.name ?? '',
      activity_type: r.activity_logs?.type ?? '',
      quantity: r.activity_logs?.quantity ?? '',
      unit: r.activity_logs?.unit ?? '',
      co2_kg: r.calculated_co2,
      source: r.source,
    })))
    setLoading(false)
  }

  useEffect(() => {
    supabase.from('departments').select('id,name').then(({ data: d }) => setDepartments(d || []))
    load()
  }, [])

  const totalCo2 = data.reduce((s, r) => s + (parseFloat(r.co2_kg) || 0), 0)

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Environmental Report</h1>
          <p className="text-xs text-gray-500 mt-0.5">Total: <strong className="text-emerald-400">{totalCo2.toFixed(2)} kg CO₂e</strong> · {data.length} records</p>
        </div>
        <button onClick={() => exportCSV(data, `environmental-report-${new Date().toISOString().slice(0,10)}.csv`)}
          className="btn-secondary flex items-center gap-2" id="export-environmental-csv">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3 items-end">
        <Filter size={15} className="text-gray-400 self-center" />
        <div><label className="block text-[10px] text-gray-500 mb-1">Department</label>
          <select className="form-input text-xs py-1.5" style={{ width: 160 }} value={filters.dept} onChange={e => setFilters(f => ({ ...f, dept: e.target.value }))}>
            <option value="">All</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select></div>
        <div><label className="block text-[10px] text-gray-500 mb-1">From</label>
          <input type="date" className="form-input text-xs py-1.5" style={{ width: 140 }} value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} /></div>
        <div><label className="block text-[10px] text-gray-500 mb-1">To</label>
          <input type="date" className="form-input text-xs py-1.5" style={{ width: 140 }} value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} /></div>
        <button onClick={load} className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>Apply</button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-emerald-400" /></div> : (
          <table className="w-full">
            <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Date', 'Department', 'Activity', 'Quantity', 'CO₂e (kg)', 'Source'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className="border-t border-white/5 table-row-hover">
                  <td className="px-4 py-3 text-xs text-gray-400">{r.date}</td>
                  <td className="px-4 py-3 text-sm text-white">{r.department}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{r.activity_type}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{r.quantity} {r.unit}</td>
                  <td className="px-4 py-3 text-sm font-mono text-emerald-400">{parseFloat(r.co2_kg).toFixed(4)}</td>
                  <td className="px-4 py-3">
                    <span className="status-badge" style={{ background: r.source === 'auto' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)', color: r.source === 'auto' ? '#60a5fa' : '#f59e0b' }}>{r.source}</span>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500 text-sm">No data for selected filters.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
