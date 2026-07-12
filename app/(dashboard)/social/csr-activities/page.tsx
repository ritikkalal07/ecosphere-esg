'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, X, Pencil, Trash2 } from 'lucide-react'

export default function CsrActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', category_id: '', department_id: '', description: '', date: new Date().toISOString().slice(0, 10) })
  const supabase = createClient()

  async function load() {
    const [{ data: acts }, { data: depts }, { data: cats }] = await Promise.all([
      supabase.from('csr_activities').select('*, categories(name), departments(name)').order('date', { ascending: false }),
      supabase.from('departments').select('id,name').eq('status', 'active'),
      supabase.from('categories').select('id,name').eq('type', 'csr_activity').eq('status', 'active'),
    ])
    setActivities(acts || [])
    setDepartments(depts || [])
    setCategories(cats || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    await supabase.from('csr_activities').insert({
      title: form.title, category_id: form.category_id || null,
      department_id: form.department_id || null, description: form.description, date: form.date,
    })
    setShowForm(false)
    setSaving(false)
    await load()
  }

  async function del(id: string) {
    if (!confirm('Delete this CSR activity?')) return
    await supabase.from('csr_activities').delete().eq('id', id)
    setActivities(a => a.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">CSR Activities</h1>
          <p className="text-xs text-gray-500 mt-0.5">Create and manage corporate social responsibility events</p>
        </div>
        <button id="add-csr-activity" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Activity
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-lg p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Create CSR Activity</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs text-gray-400 mb-1.5">Title</label>
                <input type="text" className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Activity name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-400 mb-1.5">Department</label>
                  <select className="form-input" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-400 mb-1.5">Category</label>
                  <select className="form-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">None</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Date</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Description</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Activity details..." /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.title || !form.date}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Create Activity'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-400" /></div> : (
          <table className="w-full">
            <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Title', 'Department', 'Category', 'Date', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {activities.map(a => (
                <tr key={a.id} className="border-t border-white/5 table-row-hover">
                  <td className="px-4 py-3 text-sm font-medium text-white">{a.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{a.departments?.name ?? '—'}</td>
                  <td className="px-4 py-3"><span className="status-badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>{a.categories?.name ?? '—'}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{a.date}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => del(a.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {activities.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm">No CSR activities yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
