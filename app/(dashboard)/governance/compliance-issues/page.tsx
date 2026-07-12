'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, X, AlertTriangle } from 'lucide-react'

export default function ComplianceIssuesPage() {
  const [issues, setIssues] = useState<any[]>([])
  const [audits, setAudits] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    audit_id: '', severity: 'medium', description: '', owner_id: '', due_date: ''
  })
  const supabase = createClient()

  async function load() {
    const [{ data: iss }, { data: auds }, { data: emps }] = await Promise.all([
      supabase.from('compliance_issues').select('*, profiles!owner_id(full_name, email), audits(title, departments(name))').order('created_at', { ascending: false }),
      supabase.from('audits').select('id, title'),
      supabase.from('profiles').select('id, full_name, email').in('role', ['admin', 'manager', 'employee']),
    ])
    setIssues(iss || [])
    setAudits(auds || [])
    setEmployees(emps || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    // Form-level validation — owner and due_date are required (also DB NOT NULL)
    if (!form.owner_id || !form.due_date || !form.description) {
      alert('Owner, due date, and description are required.')
      return
    }
    setSaving(true)
    await supabase.from('compliance_issues').insert({
      audit_id: form.audit_id || null,
      severity: form.severity,
      description: form.description,
      owner_id: form.owner_id,  // NOT NULL in DB
      due_date: form.due_date,  // NOT NULL in DB
    })
    setShowForm(false)
    setSaving(false)
    await load()
  }

  async function resolve(id: string) {
    await supabase.from('compliance_issues').update({ status: 'resolved', updated_at: new Date().toISOString() }).eq('id', id)
    await load()
  }

  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = (issue: any) => issue.due_date < today && issue.status === 'open'

  const SEV_COLORS: any = {
    low: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    medium: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    high: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
    critical: { bg: 'rgba(239,68,68,0.25)', color: '#ef4444' },
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Compliance Issues</h1>
          <p className="text-xs text-gray-500 mt-0.5">Overdue issues are flagged automatically from the database view — no refresh trick needed</p>
        </div>
        <button id="add-compliance-issue" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Issue
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-lg p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">New Compliance Issue</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs text-gray-400 mb-1.5">Linked Audit (optional)</label>
                <select className="form-input" value={form.audit_id} onChange={e => setForm(f => ({ ...f, audit_id: e.target.value }))}>
                  <option value="">None</option>
                  {audits.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select></div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Description *</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the compliance issue" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-400 mb-1.5">Severity</label>
                  <select className="form-input" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="critical">Critical</option>
                  </select></div>
                <div><label className="block text-xs text-gray-400 mb-1.5">Due Date *</label>
                  <input type="date" className="form-input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
              </div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Owner (Responsible) *</label>
                <select className="form-input" value={form.owner_id} onChange={e => setForm(f => ({ ...f, owner_id: e.target.value }))}>
                  <option value="">Select owner</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.email})</option>)}
                </select></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.description || !form.owner_id || !form.due_date}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}{saving ? 'Saving…' : 'Create Issue'}
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
              {['Issue', 'Severity', 'Owner', 'Due Date', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {issues.map(issue => {
                const overdue = isOverdue(issue)
                return (
                  <tr key={issue.id}
                    className="border-t border-white/5 table-row-hover"
                    style={{ background: overdue ? 'rgba(239,68,68,0.04)' : undefined }}>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{issue.description.slice(0, 60)}{issue.description.length > 60 ? '…' : ''}</div>
                      {issue.audits && <div className="text-[10px] text-gray-500 mt-0.5">Audit: {issue.audits.title}</div>}
                    </td>
                    <td className="px-4 py-3"><span className="status-badge" style={{ background: SEV_COLORS[issue.severity]?.bg, color: SEV_COLORS[issue.severity]?.color }}>{issue.severity}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{issue.profiles?.full_name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${overdue ? 'text-red-400' : 'text-gray-400'}`}>
                        {overdue && <AlertTriangle size={11} className="inline mr-1" />}{issue.due_date}
                        {overdue && <span className="ml-1 text-red-400">(OVERDUE)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="status-badge" style={{
                        background: issue.status === 'resolved' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                        color: issue.status === 'resolved' ? '#10b981' : '#f59e0b'
                      }}>{issue.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {issue.status === 'open' && (
                        <button onClick={() => resolve(issue.id)} className="text-xs text-emerald-400 hover:underline">Mark Resolved</button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {issues.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500 text-sm">No compliance issues.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
