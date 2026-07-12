'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, X } from 'lucide-react'

export default function AuditsPage() {
  const [audits, setAudits] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', department_id: '', date: new Date().toISOString().slice(0,10), findings_summary: '', status: 'open' })
  const supabase = createClient()

  async function load() {
    const [{ data: a }, { data: d }] = await Promise.all([
      supabase.from('audits').select('*, departments(name)').order('date', { ascending: false }),
      supabase.from('departments').select('id,name').eq('status', 'active'),
    ])
    setAudits(a || [])
    setDepartments(d || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    await supabase.from('audits').insert({
      title: form.title, department_id: form.department_id || null,
      date: form.date, findings_summary: form.findings_summary, status: form.status,
    })
    setShowForm(false)
    setSaving(false)
    await load()
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-white">Audits</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track governance audits and link compliance issues</p></div>
        <button id="add-audit" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus size={15} /> New Audit</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-lg p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">New Audit</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs text-gray-400 mb-1.5">Title</label>
                <input type="text" className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Audit name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-400 mb-1.5">Department</label>
                  <select className="form-input" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                    <option value="">All / N/A</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-400 mb-1.5">Date</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              </div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Findings Summary</label>
                <textarea className="form-input" rows={3} value={form.findings_summary} onChange={e => setForm(f => ({ ...f, findings_summary: e.target.value }))} /></div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Status</label>
                <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="open">Open</option><option value="closed">Closed</option>
                </select></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.title}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}{saving ? 'Saving…' : 'Save Audit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-violet-400" /></div> : (
          <table className="w-full">
            <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Title', 'Department', 'Date', 'Status', 'Findings'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {audits.map(a => (
                <tr key={a.id} className="border-t border-white/5 table-row-hover">
                  <td className="px-4 py-3 text-sm font-medium text-white">{a.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{a.departments?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{a.date}</td>
                  <td className="px-4 py-3"><span className="status-badge" style={{
                    background: a.status === 'open' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                    color: a.status === 'open' ? '#f59e0b' : '#10b981'
                  }}>{a.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{a.findings_summary || '—'}</td>
                </tr>
              ))}
              {audits.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm">No audits yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
