'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, X, Pencil, Trash2 } from 'lucide-react'
import type { Category } from '@/lib/types'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'csr_activity' as 'csr_activity' | 'challenge',
    status: 'active' as 'active' | 'inactive'
  })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setEditing(null)
    setForm({ name: '', type: 'csr_activity', status: 'active' })
    setShowForm(true)
  }

  function openEdit(c: Category) {
    setEditing(c)
    setForm({
      name: c.name,
      type: c.type,
      status: c.status
    })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const payload = {
      name: form.name,
      type: form.type,
      status: form.status
    }

    if (editing) {
      await supabase.from('categories').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('categories').insert(payload)
    }
    setShowForm(false)
    setSaving(false)
    await load()
  }

  async function del(id: string) {
    if (!confirm('Delete this category?')) return
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Categories</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage activity and challenge categories</p>
        </div>
        <button id="add-category" onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">{editing ? 'Edit' : 'Add'} Category</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Category Name</label>
                <input type="text" className="form-input" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Volunteer" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Type</label>
                <select className="form-input" value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                  <option value="csr_activity">CSR Activity</option>
                  <option value="challenge">Challenge</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Status</label>
                <select className="form-input" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.name}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Name', 'Type', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className="border-t border-white/5 table-row-hover">
                  <td className="px-4 py-3 text-sm text-white font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="status-badge" style={{
                      background: c.type === 'csr_activity' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)',
                      color: c.type === 'csr_activity' ? '#3b82f6' : '#f59e0b'
                    }}>
                      {c.type === 'csr_activity' ? 'CSR Activity' : 'Challenge'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="status-badge" style={{
                      background: c.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: c.status === 'active' ? '#10b981' : '#f87171'
                    }}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => del(c.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500 text-sm">No categories yet. Add one to classify ESG activities.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
