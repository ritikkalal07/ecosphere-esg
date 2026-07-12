'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, X, Pencil, Trash2 } from 'lucide-react'
import type { ESGPolicy } from '@/lib/types'

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<ESGPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ESGPolicy | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: '', version: '1.0', status: 'draft' as ESGPolicy['status'] })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('esg_policies').select('*').order('created_at', { ascending: false })
    setPolicies(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm({ title: '', description: '', category: '', version: '1.0', status: 'draft' })
    setShowForm(true)
  }

  function openEdit(p: ESGPolicy) {
    setEditing(p)
    setForm({ title: p.title, description: p.description || '', category: p.category, version: p.version, status: p.status })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const payload = { title: form.title, description: form.description, category: form.category, version: form.version, status: form.status, updated_at: new Date().toISOString() }
    if (editing) {
      await supabase.from('esg_policies').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('esg_policies').insert(payload)
    }
    setShowForm(false)
    setSaving(false)
    await load()
  }

  const STATUS_COLORS: any = {
    draft: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
    active: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    archived: { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">ESG Policies</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage versioned ESG policies for acknowledgement</p>
        </div>
        <button id="add-policy" onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={15} /> New Policy</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-lg p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">{editing ? 'Edit' : 'New'} Policy</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs text-gray-400 mb-1.5">Title</label>
                <input type="text" className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Policy name" /></div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Description</label>
                <textarea className="form-input" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs text-gray-400 mb-1.5">Category</label>
                  <input type="text" className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Environment" /></div>
                <div><label className="block text-xs text-gray-400 mb-1.5">Version</label>
                  <input type="text" className="form-input" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} /></div>
                <div><label className="block text-xs text-gray-400 mb-1.5">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                    <option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option>
                  </select></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.title || !form.category}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}{saving ? 'Saving…' : 'Save Policy'}
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
              {['Title', 'Category', 'Version', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {policies.map(p => (
                <tr key={p.id} className="border-t border-white/5 table-row-hover">
                  <td className="px-4 py-3 text-sm font-medium text-white">{p.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{p.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">v{p.version}</td>
                  <td className="px-4 py-3"><span className="status-badge" style={{ background: STATUS_COLORS[p.status]?.bg, color: STATUS_COLORS[p.status]?.color }}>{p.status}</span></td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Pencil size={13} /></button>
                  </td>
                </tr>
              ))}
              {policies.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm">No policies yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
