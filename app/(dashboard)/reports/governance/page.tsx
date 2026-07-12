'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Download, AlertTriangle } from 'lucide-react'

function exportCSV(data: any[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click()
}

export default function GovernanceReport() {
  const [issues, setIssues] = useState<any[]>([])
  const [policies, setPolicies] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ severity: '', status: '', dept: '' })
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)

  async function load() {
    setLoading(true)
    let q = supabase.from('compliance_issues')
      .select('*, profiles!owner_id(full_name), audits(title, departments(id,name))')
      .order('due_date', { ascending: true })
    if (filters.severity) q = q.eq('severity', filters.severity)
    if (filters.status) q = q.eq('status', filters.status)
    const { data: issData } = await q
    let filtered = (issData || [])
    if (filters.dept) filtered = filtered.filter((i: any) => i.audits?.departments?.id === filters.dept)
    setIssues(filtered)

    const { data: pol } = await supabase.from('esg_policies').select('*').order('created_at', { ascending: false })
    setPolicies(pol || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.from('departments').select('id,name').then(({ data: d }) => setDepartments(d || []))
    load()
  }, [])

  const exportData = issues.map((i: any) => ({
    description: i.description, severity: i.severity, owner: i.profiles?.full_name ?? '',
    department: i.audits?.departments?.name ?? '', audit: i.audits?.title ?? '', due_date: i.due_date,
    status: i.status, overdue: i.due_date < today && i.status === 'open' ? 'YES' : 'NO'
  }))

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Governance Report</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {issues.length} issues · <span className="text-red-400">{issues.filter((i: any) => i.due_date < today && i.status === 'open').length} overdue</span>
          </p>
        </div>
        <button id="export-governance-csv" onClick={() => exportCSV(exportData, `governance-report-${new Date().toISOString().slice(0,10)}.csv`)}
          className="btn-secondary flex items-center gap-2"><Download size={14} /> Export CSV</button>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3 items-end">
        <div><label className="block text-[10px] text-gray-500 mb-1">Department</label>
          <select className="form-input text-xs py-1.5" style={{ width: 150 }} value={filters.dept} onChange={e => setFilters(f => ({ ...f, dept: e.target.value }))}>
            <option value="">All</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div><label className="block text-[10px] text-gray-500 mb-1">Severity</label>
          <select className="form-input text-xs py-1.5" style={{ width: 120 }} value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}>
            <option value="">All</option>{['low','medium','high','critical'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label className="block text-[10px] text-gray-500 mb-1">Status</label>
          <select className="form-input text-xs py-1.5" style={{ width: 120 }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All</option><option value="open">Open</option><option value="resolved">Resolved</option></select></div>
        <button onClick={load} className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>Apply</button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-violet-400" /></div> : (
          <table className="w-full">
            <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Issue', 'Severity', 'Owner', 'Department', 'Due Date', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {issues.map((r: any, i) => {
                const overdue = r.due_date < today && r.status === 'open'
                const SEV: any = { low: '#10b981', medium: '#f59e0b', high: '#f87171', critical: '#ef4444' }
                return (
                  <tr key={i} className="border-t border-white/5 table-row-hover" style={{ background: overdue ? 'rgba(239,68,68,0.04)' : undefined }}>
                    <td className="px-4 py-3 text-xs text-gray-300 max-w-xs truncate">{r.description}</td>
                    <td className="px-4 py-3"><span className="status-badge" style={{ background: `${SEV[r.severity]}20`, color: SEV[r.severity] }}>{r.severity}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{r.profiles?.full_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{r.audits?.departments?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${overdue ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                        {overdue && <AlertTriangle size={10} className="inline mr-1" />}{r.due_date}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="status-badge" style={{ background: r.status==='resolved'?'rgba(16,185,129,0.12)':'rgba(245,158,11,0.12)', color: r.status==='resolved'?'#10b981':'#f59e0b' }}>{r.status}</span>
                    </td>
                  </tr>
                )
              })}
              {issues.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500 text-sm">No issues for selected filters.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
