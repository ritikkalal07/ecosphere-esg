'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Download, Filter } from 'lucide-react'

function exportCSV(data: any[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = filename; a.click()
}

export default function SocialReport() {
  const [data, setData] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ dept: '', from: '', to: '', status: '' })
  const supabase = createClient()

  async function load() {
    setLoading(true)
    let q = supabase.from('employee_participations')
      .select('*, profiles!employee_id(full_name, email), csr_activities(title, date, departments(name))')
      .order('created_at', { ascending: false }).limit(500)
    if (filters.status) q = q.eq('approval_status', filters.status)
    const { data: rows } = await q

    let filtered = (rows || []).map((r: any) => ({
      employee: r.profiles?.full_name ?? '',
      email: r.profiles?.email ?? '',
      activity: r.csr_activities?.title ?? '',
      department: r.csr_activities?.departments?.name ?? '',
      date: r.csr_activities?.date ?? '',
      status: r.approval_status,
      points_earned: r.points_earned,
      has_proof: !!r.proof_url,
    }))

    if (filters.dept) filtered = filtered.filter(r => r.department === departments.find(d => d.id === filters.dept)?.name)
    if (filters.from) filtered = filtered.filter(r => r.date >= filters.from)
    if (filters.to) filtered = filtered.filter(r => r.date <= filters.to)
    setData(filtered)
    setLoading(false)
  }

  useEffect(() => {
    supabase.from('departments').select('id,name').then(({ data: d }) => setDepartments(d || []))
    load()
  }, [])

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Social Report</h1>
          <p className="text-xs text-gray-500 mt-0.5">{data.length} participation records · {data.filter(r => r.status === 'approved').length} approved</p>
        </div>
        <button id="export-social-csv" onClick={() => exportCSV(data, `social-report-${new Date().toISOString().slice(0,10)}.csv`)}
          className="btn-secondary flex items-center gap-2"><Download size={14} /> Export CSV</button>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3 items-end">
        <Filter size={15} className="text-gray-400 self-center" />
        <div><label className="block text-[10px] text-gray-500 mb-1">Department</label>
          <select className="form-input text-xs py-1.5" style={{ width: 150 }} value={filters.dept} onChange={e => setFilters(f => ({ ...f, dept: e.target.value }))}>
            <option value="">All</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div><label className="block text-[10px] text-gray-500 mb-1">Status</label>
          <select className="form-input text-xs py-1.5" style={{ width: 120 }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
          </select></div>
        <div><label className="block text-[10px] text-gray-500 mb-1">From</label>
          <input type="date" className="form-input text-xs py-1.5" style={{ width: 140 }} value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} /></div>
        <div><label className="block text-[10px] text-gray-500 mb-1">To</label>
          <input type="date" className="form-input text-xs py-1.5" style={{ width: 140 }} value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} /></div>
        <button onClick={load} className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>Apply</button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-400" /></div> : (
          <table className="w-full">
            <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Employee', 'Activity', 'Department', 'Date', 'Status', 'Points', 'Proof'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className="border-t border-white/5 table-row-hover">
                  <td className="px-4 py-3 text-sm text-white">{r.employee}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{r.activity}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{r.department}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{r.date}</td>
                  <td className="px-4 py-3">
                    <span className="status-badge" style={{ background: r.status==='approved'?'rgba(16,185,129,0.12)':r.status==='pending'?'rgba(245,158,11,0.12)':'rgba(239,68,68,0.12)', color: r.status==='approved'?'#10b981':r.status==='pending'?'#f59e0b':'#f87171' }}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-emerald-400">{r.points_earned}</td>
                  <td className="px-4 py-3 text-xs">{r.has_proof ? '✓' : '—'}</td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500 text-sm">No data for selected filters.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
