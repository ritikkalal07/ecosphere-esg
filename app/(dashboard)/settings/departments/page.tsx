'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, X, Pencil, Trash2 } from 'lucide-react'
import type { Department } from '@/lib/types'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    code: '',
    parent_department_id: '',
    status: 'active' as 'active' | 'inactive'
  })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .order('name')
    setDepartments(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setEditing(null)
    setForm({ name: '', code: '', parent_department_id: '', status: 'active' })
    setShowForm(true)
  }

  function openEdit(d: Department) {
    setEditing(d)
    setForm({
      name: d.name,
      code: d.code,
      parent_department_id: d.parent_department_id || '',
      status: d.status
    })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const payload = {
      name: form.name,
      code: form.code,
      parent_department_id: form.parent_department_id || null,
      status: form.status
    }

    if (editing) {
      await supabase.from('departments').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('departments').insert(payload)
    }
    setShowForm(false)
    setSaving(false)
    await load()
  }

  async function del(id: string) {
    if (!confirm('Delete this department? Any children departments might lose their parent reference.')) return
    await supabase.from('departments').delete().eq('id', id)
    setDepartments(prev => prev.filter(d => d.id !== id))
  }

  const getParentName = (parentId: string | null) => {
    if (!parentId) return 'None'
    const parent = departments.find(d => d.id === parentId)
    return parent ? parent.name : 'Unknown'
  }

  // Filter out the editing department to prevent setting it as its own parent
  const availableParents = departments.filter(d => !editing || d.id !== editing.id)

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Departments</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage department records and parent hierarchies</p>
        </div>
        <button id="add-department" onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Department
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">{editing ? 'Edit' : 'Add'} Department</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Department Name</label>
                <input type="text" className="form-input" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Human Resources" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Code</label>
                <input type="text" className="form-input" value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. HR-001" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Parent Department</label>
                <select className="form-input" value={form.parent_department_id}
                  onChange={e => setForm(f => ({ ...f, parent_department_id: e.target.value }))}>
                  <option value="">None</option>
                  {availableParents.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
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
                <button onClick={save} disabled={saving || !form.name || !form.code}
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
                {['Name', 'Code', 'Parent Dept', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map(d => (
                <tr key={d.id} className="border-t border-white/5 table-row-hover">
                  <td className="px-4 py-3 text-sm text-white font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-400">{d.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{getParentName(d.parent_department_id)}</td>
                  <td className="px-4 py-3">
                    <span className="status-badge" style={{
                      background: d.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: d.status === 'active' ? '#10b981' : '#f87171'
                    }}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(d)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => del(d.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm">No departments yet. Add one to start organizing.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
